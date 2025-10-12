const express = require('express');
const { MongoClient } = require('mongodb');
const Redis = require('redis');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const puppeteer = require('puppeteer');
const AWS = require('aws-sdk');
const tf = require('@tensorflow/tfjs-node');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/resume-service.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class ResumeService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3002;
    this.initializeConnections();
    this.initializeAI();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initializeConnections() {
    // MongoDB connection
    this.mongoClient = new MongoClient(process.env.MONGODB_URL);
    await this.mongoClient.connect();
    this.db = this.mongoClient.db('career_platform');
    this.resumesCollection = this.db.collection('resumes');
    this.templatesCollection = this.db.collection('templates');
    
    // Redis connection
    this.redis = Redis.createClient({ url: process.env.REDIS_URL });
    await this.redis.connect();
    
    // AWS S3 for file storage
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    
    logger.info('Resume Service connections initialized');
  }

  async initializeAI() {
    // Load pre-trained models for resume optimization
    try {
      // Keyword extraction model
      this.keywordModel = await tf.loadLayersModel('models/keyword-extraction/model.json');
      
      // ATS compatibility scoring model
      this.atsModel = await tf.loadLayersModel('models/ats-scoring/model.json');
      
      // Content optimization model
      this.optimizationModel = await tf.loadLayersModel('models/content-optimization/model.json');
      
      logger.info('AI models loaded successfully');
    } catch (error) {
      logger.error('Failed to load AI models:', error);
      // Continue without AI features for now
    }
  }

  initializeMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // CORS
    this.app.use(require('cors')({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    // Security
    this.app.use(require('helmet')());
    
    // Logging
    this.app.use(require('morgan')('combined', {
      stream: { write: message => logger.info(message.trim()) }
    }));
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'resume-service',
        timestamp: new Date().toISOString()
      });
    });

    // Resume CRUD operations
    this.app.post('/resumes', this.authenticateUser, this.validateResumeCreate, this.createResume.bind(this));
    this.app.get('/resumes', this.authenticateUser, this.getResumes.bind(this));
    this.app.get('/resumes/:id', this.authenticateUser, this.getResume.bind(this));
    this.app.put('/resumes/:id', this.authenticateUser, this.validateResumeUpdate, this.updateResume.bind(this));
    this.app.delete('/resumes/:id', this.authenticateUser, this.deleteResume.bind(this));

    // Resume generation and export
    this.app.post('/resumes/:id/generate', this.authenticateUser, this.generateResumeHTML.bind(this));
    this.app.post('/resumes/:id/export/pdf', this.authenticateUser, this.exportToPDF.bind(this));
    this.app.post('/resumes/:id/export/docx', this.authenticateUser, this.exportToDocx.bind(this));

    // AI-powered features
    this.app.post('/resumes/:id/optimize', this.authenticateUser, this.optimizeResume.bind(this));
    this.app.post('/resumes/:id/analyze', this.authenticateUser, this.analyzeResume.bind(this));
    this.app.post('/resumes/match-job', this.authenticateUser, this.matchJobDescription.bind(this));

    // Template management
    this.app.get('/templates', this.getTemplates.bind(this));
    this.app.get('/templates/:id', this.getTemplate.bind(this));
    this.app.post('/templates', this.authenticateUser, this.requireAdmin, this.createTemplate.bind(this));

    // Analytics
    this.app.get('/resumes/:id/analytics', this.authenticateUser, this.getResumeAnalytics.bind(this));
    this.app.post('/resumes/:id/track-view', this.trackResumeView.bind(this));
    this.app.post('/resumes/:id/track-download', this.authenticateUser, this.trackResumeDownload.bind(this));
  }

  // Middleware
  authenticateUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify token with user service (simplified - in production, use JWT verification)
      const response = await fetch(`${process.env.USER_SERVICE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userData = await response.json();
      req.user = userData.user;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

  requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  validateResumeCreate = (req, res, next) => {
    const schema = Joi.object({
      title: Joi.string().min(1).max(200).required(),
      templateId: Joi.string().required(),
      targetRole: Joi.string().max(200).optional(),
      targetCompany: Joi.string().max(200).optional(),
      theme: Joi.string().valid('standard', 'modern', 'classic', 'creative', 'tech', 'finance').default('standard'),
      content: Joi.object({
        basics: Joi.object().required(),
        work: Joi.array().default([]),
        education: Joi.array().default([]),
        skills: Joi.array().default([]),
        projects: Joi.array().default([]),
        publications: Joi.array().default([]),
        awards: Joi.array().default([]),
        certificates: Joi.array().default([]),
        languages: Joi.array().default([]),
        interests: Joi.array().default([])
      }).required()
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

  validateResumeUpdate = (req, res, next) => {
    const schema = Joi.object({
      title: Joi.string().min(1).max(200).optional(),
      templateId: Joi.string().optional(),
      targetRole: Joi.string().max(200).optional(),
      targetCompany: Joi.string().max(200).optional(),
      theme: Joi.string().valid('standard', 'modern', 'classic', 'creative', 'tech', 'finance').optional(),
      content: Joi.object().optional(),
      isActive: Joi.boolean().optional()
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

  // Route handlers
  async createResume(req, res) {
    try {
      const { title, templateId, targetRole, targetCompany, theme, content } = req.body;
      const userId = req.user.id;

      // Check user's subscription limits
      const userResumes = await this.resumesCollection.countDocuments({ userId, isDeleted: { $ne: true } });
      const subscriptionLimits = await this.getSubscriptionLimits(req.user.subscriptionPlan);
      
      if (userResumes >= subscriptionLimits.resumes && subscriptionLimits.resumes !== -1) {
        return res.status(403).json({ 
          error: 'Resume limit reached for your subscription plan',
          limit: subscriptionLimits.resumes,
          current: userResumes
        });
      }

      // Get template
      const template = await this.templatesCollection.findOne({ _id: templateId });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Create resume document
      const resumeId = uuidv4();
      const resumeData = {
        _id: resumeId,
        userId,
        title,
        templateId,
        targetRole,
        targetCompany,
        theme,
        content,
        version: '1.0.0',
        isActive: true,
        isDeleted: false,
        metadata: {
          atsOptimized: false,
          keywordDensity: {},
          readabilityScore: 0,
          aiBenchmark: {
            score: 0,
            suggestions: []
          }
        },
        analytics: {
          views: 0,
          downloads: 0,
          applications: 0,
          interviews: 0,
          lastViewed: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert resume
      await this.resumesCollection.insertOne(resumeData);

      // Trigger AI analysis in background
      this.analyzeResumeBackground(resumeId);

      logger.info(`Resume created: ${resumeId} for user: ${userId}`);

      res.status(201).json({
        message: 'Resume created successfully',
        resume: {
          id: resumeData._id,
          title: resumeData.title,
          templateId: resumeData.templateId,
          targetRole: resumeData.targetRole,
          targetCompany: resumeData.targetCompany,
          theme: resumeData.theme,
          version: resumeData.version,
          createdAt: resumeData.createdAt
        }
      });
    } catch (error) {
      logger.error('Create resume error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getResumes(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = { userId, isDeleted: { $ne: true } };
      
      // Add filters
      if (req.query.targetRole) {
        filter.targetRole = new RegExp(req.query.targetRole, 'i');
      }
      if (req.query.theme) {
        filter.theme = req.query.theme;
      }
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }

      const resumes = await this.resumesCollection
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .project({
          _id: 1,
          title: 1,
          templateId: 1,
          targetRole: 1,
          targetCompany: 1,
          theme: 1,
          version: 1,
          isActive: 1,
          'metadata.atsOptimized': 1,
          'metadata.aiBenchmark.score': 1,
          'analytics.views': 1,
          'analytics.downloads': 1,
          createdAt: 1,
          updatedAt: 1
        })
        .toArray();

      const total = await this.resumesCollection.countDocuments(filter);

      res.json({
        resumes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get resumes error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async optimizeResume(req, res) {
    try {
      const resumeId = req.params.id;
      const { jobDescription, targetKeywords } = req.body;

      // Get resume
      const resume = await this.resumesCollection.findOne({
        _id: resumeId,
        userId: req.user.id,
        isDeleted: { $ne: true }
      });

      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      // AI-powered optimization
      const optimization = await this.performAIOptimization(resume, jobDescription, targetKeywords);

      // Update resume with optimization suggestions
      await this.resumesCollection.updateOne(
        { _id: resumeId },
        {
          $set: {
            'metadata.atsOptimized': true,
            'metadata.keywordDensity': optimization.keywordDensity,
            'metadata.aiBenchmark': optimization.aiBenchmark,
            'metadata.optimizationSuggestions': optimization.suggestions,
            updatedAt: new Date()
          }
        }
      );

      res.json({
        message: 'Resume optimization completed',
        optimization: {
          atsScore: optimization.atsScore,
          keywordMatch: optimization.keywordMatch,
          suggestions: optimization.suggestions,
          optimizedContent: optimization.optimizedContent
        }
      });
    } catch (error) {
      logger.error('Resume optimization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generateResumeHTML(req, res) {
    try {
      const resumeId = req.params.id;
      const { format = 'html', includeAnalytics = false } = req.body;

      // Get resume and template
      const resume = await this.resumesCollection.findOne({
        _id: resumeId,
        userId: req.user.id,
        isDeleted: { $ne: true }
      });

      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      const template = await this.templatesCollection.findOne({ _id: resume.templateId });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Generate HTML
      const html = await this.renderResumeHTML(resume, template);

      // Track generation
      await this.resumesCollection.updateOne(
        { _id: resumeId },
        { $inc: { 'analytics.downloads': 1 } }
      );

      if (format === 'pdf') {
        const pdfBuffer = await this.convertHTMLToPDF(html);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="resume-${resumeId}.pdf"`);
        res.send(pdfBuffer);
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      }
    } catch (error) {
      logger.error('Generate resume HTML error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async performAIOptimization(resume, jobDescription, targetKeywords) {
    try {
      // This is a simplified version - in production, use proper NLP models
      const currentContent = JSON.stringify(resume.content);
      const keywords = targetKeywords || this.extractKeywordsFromJob(jobDescription);
      
      // Calculate keyword density
      const keywordDensity = {};
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = currentContent.match(regex) || [];
        keywordDensity[keyword] = matches.length;
      });

      // Calculate ATS score (simplified)
      const totalKeywords = keywords.length;
      const matchedKeywords = Object.values(keywordDensity).filter(count => count > 0).length;
      const atsScore = Math.round((matchedKeywords / totalKeywords) * 100);

      // Generate suggestions
      const suggestions = [];
      keywords.forEach(keyword => {
        if (keywordDensity[keyword] === 0) {
          suggestions.push(`Consider adding "${keyword}" to your resume content`);
        } else if (keywordDensity[keyword] < 2) {
          suggestions.push(`Consider mentioning "${keyword}" more frequently`);
        }
      });

      return {
        atsScore,
        keywordMatch: (matchedKeywords / totalKeywords) * 100,
        keywordDensity,
        suggestions,
        aiBenchmark: {
          score: atsScore,
          suggestions: suggestions.slice(0, 5) // Top 5 suggestions
        },
        optimizedContent: resume.content // In production, actually optimize content
      };
    } catch (error) {
      logger.error('AI optimization error:', error);
      throw error;
    }
  }

  extractKeywordsFromJob(jobDescription) {
    // Simplified keyword extraction - in production, use NLP libraries
    const commonKeywords = [
      'leadership', 'management', 'agile', 'scrum', 'engineering', 'software',
      'architecture', 'cloud', 'aws', 'azure', 'microservices', 'api',
      'javascript', 'python', 'java', 'react', 'node.js', 'database',
      'sql', 'nosql', 'devops', 'ci/cd', 'docker', 'kubernetes'
    ];
    
    const jobLower = jobDescription.toLowerCase();
    return commonKeywords.filter(keyword => jobLower.includes(keyword));
  }

  async renderResumeHTML(resume, template) {
    // Simplified HTML rendering - in production, use proper templating engine
    const { content } = resume;
    const { basics, work, education, skills } = content;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${basics.name} - Resume</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
            .work-item { margin-bottom: 15px; }
            .work-header { font-weight: bold; }
            .work-dates { font-style: italic; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${basics.name}</h1>
            <p>${basics.label || ''}</p>
            <p>${basics.email} | ${basics.phone || ''}</p>
        </div>
        
        ${basics.summary ? `
        <div class="section">
            <h2>Summary</h2>
            <p>${basics.summary}</p>
        </div>
        ` : ''}

        ${work && work.length ? `
        <div class="section">
            <h2>Experience</h2>
            ${work.map(job => `
                <div class="work-item">
                    <div class="work-header">${job.position} at ${job.name}</div>
                    <div class="work-dates">${job.startDate} - ${job.endDate || 'Present'}</div>
                    <p>${job.summary || ''}</p>
                    ${job.highlights ? `
                        <ul>
                            ${job.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${education && education.length ? `
        <div class="section">
            <h2>Education</h2>
            ${education.map(edu => `
                <div class="work-item">
                    <div class="work-header">${edu.studyType} in ${edu.area}</div>
                    <div>${edu.institution}</div>
                    <div class="work-dates">${edu.startDate} - ${edu.endDate}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${skills && skills.length ? `
        <div class="section">
            <h2>Skills</h2>
            ${skills.map(skillGroup => `
                <div>
                    <strong>${skillGroup.name}:</strong> ${skillGroup.keywords?.join(', ') || ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
    </body>
    </html>
    `;
  }

  async convertHTMLToPDF(html) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      });
      
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  async getSubscriptionLimits(plan) {
    const limits = {
      free: { resumes: 2, downloads: 5, exports: 1 },
      professional: { resumes: 10, downloads: 50, exports: 25 },
      enterprise: { resumes: -1, downloads: -1, exports: -1 }
    };
    return limits[plan] || limits.free;
  }

  async analyzeResumeBackground(resumeId) {
    // Perform AI analysis in background
    setTimeout(async () => {
      try {
        const resume = await this.resumesCollection.findOne({ _id: resumeId });
        if (resume) {
          const analysis = await this.performAIOptimization(resume, '', []);
          await this.resumesCollection.updateOne(
            { _id: resumeId },
            { $set: { 'metadata.aiBenchmark': analysis.aiBenchmark } }
          );
        }
      } catch (error) {
        logger.error('Background analysis error:', error);
      }
    }, 1000);
  }

  initializeErrorHandling() {
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      logger.info(`Resume Service started on port ${this.port}`);
    });
  }
}

if (require.main === module) {
  const resumeService = new ResumeService();
  resumeService.start();
}

module.exports = ResumeService;
