const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const Redis = require('redis');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class UserService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.initializeDatabase();
    this.initializeRedis();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeDatabase() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  initializeRedis() {
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
    
    this.redis.on('error', (err) => logger.error('Redis Error:', err));
    this.redis.on('connect', () => logger.info('Redis connected'));
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // General middleware
    this.app.use(compression());
    this.app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'user-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Authentication routes
    this.app.post('/auth/register', this.validateRegistration, this.register.bind(this));
    this.app.post('/auth/login', this.validateLogin, this.login.bind(this));
    this.app.post('/auth/refresh', this.refreshToken.bind(this));
    this.app.post('/auth/logout', this.authenticateToken, this.logout.bind(this));
    this.app.post('/auth/forgot-password', this.forgotPassword.bind(this));
    this.app.post('/auth/reset-password', this.resetPassword.bind(this));

    // User profile routes
    this.app.get('/users/profile', this.authenticateToken, this.getProfile.bind(this));
    this.app.put('/users/profile', this.authenticateToken, this.validateProfileUpdate, this.updateProfile.bind(this));
    this.app.delete('/users/profile', this.authenticateToken, this.deleteProfile.bind(this));
    this.app.post('/users/profile/avatar', this.authenticateToken, this.uploadAvatar.bind(this));

    // User management (admin only)
    this.app.get('/users', this.authenticateToken, this.requireAdmin, this.getUsers.bind(this));
    this.app.get('/users/:id', this.authenticateToken, this.requireAdmin, this.getUserById.bind(this));
    this.app.put('/users/:id/status', this.authenticateToken, this.requireAdmin, this.updateUserStatus.bind(this));

    // Analytics
    this.app.get('/analytics/users', this.authenticateToken, this.requireAdmin, this.getUserAnalytics.bind(this));
  }

  // Validation middleware
  validateRegistration = (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required(),
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      role: Joi.string().valid('job_seeker', 'coach', 'recruiter').default('job_seeker'),
      organizationId: Joi.string().uuid().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };

  validateLogin = (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false)
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };

  validateProfileUpdate = (req, res, next) => {
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      phone: Joi.string().pattern(/^[+]?[1-9]\\d{1,14}$/).optional(),
      location: Joi.object({
        city: Joi.string().max(100),
        country: Joi.string().max(100),
        remote: Joi.boolean()
      }).optional(),
      summary: Joi.string().max(1000).optional(),
      headline: Joi.string().max(200).optional(),
      experienceYears: Joi.number().min(0).max(50).optional(),
      currentSalary: Joi.number().min(0).optional(),
      desiredSalary: Joi.number().min(0).optional(),
      skills: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert'),
        years: Joi.number().min(0).max(50)
      })).optional(),
      languages: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        fluency: Joi.string().valid('basic', 'conversational', 'fluent', 'native')
      })).optional(),
      socialProfiles: Joi.object({
        linkedin: Joi.string().uri().optional(),
        github: Joi.string().uri().optional(),
        website: Joi.string().uri().optional()
      }).optional(),
      preferences: Joi.object().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };

  // Authentication middleware
  authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ error: 'Token has been revoked' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };

  requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  // Route handlers
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, role, organizationId } = req.body;

      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = uuidv4();
      const userResult = await this.db.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, first_name, last_name, role, created_at`,
        [userId, email, passwordHash, firstName, lastName, role, organizationId]
      );

      // Create user profile
      await this.db.query(
        'INSERT INTO user_profiles (id, user_id) VALUES ($1, $2)',
        [uuidv4(), userId]
      );

      const user = userResult.rows[0];

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token
      await this.redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

      logger.info(`User registered successfully: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req, res) {
    try {
      const { email, password, rememberMe } = req.body;

      // Get user
      const userResult = await this.db.query(
        `SELECT u.*, up.* FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.email = $1 AND u.is_active = true`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await this.db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days

      // Store refresh token
      await this.redis.setex(`refresh:${user.id}`, refreshTokenExpiry, refreshToken);

      logger.info(`User logged in successfully: ${email}`);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          profileCompletionScore: user.profile_completion_score
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const profileResult = await this.db.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.subscription_plan, u.created_at,
                up.phone, up.location, up.summary, up.headline, up.experience_years,
                up.current_salary, up.desired_salary, up.availability, up.skills,
                up.languages, up.social_profiles, up.preferences
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (profileResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profile = profileResult.rows[0];

      res.json({
        profile: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          subscriptionPlan: profile.subscription_plan,
          phone: profile.phone,
          location: profile.location,
          summary: profile.summary,
          headline: profile.headline,
          experienceYears: profile.experience_years,
          currentSalary: profile.current_salary,
          desiredSalary: profile.desired_salary,
          availability: profile.availability,
          skills: profile.skills,
          languages: profile.languages,
          socialProfiles: profile.social_profiles,
          preferences: profile.preferences,
          createdAt: profile.created_at
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      logger.info(`User Service started on port ${this.port}`);
    });
  }
}

// Start the service
if (require.main === module) {
  const userService = new UserService();
  userService.start();
}

module.exports = UserService;
