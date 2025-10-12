const fs = require('fs');
const path = require('path');

class JobDescriptionProcessor {
    constructor() {
        this.companiesPath = path.join(__dirname, '..', 'companies');
    }

    /**
     * Load job description by company and role
     */
    loadJobDescription(company, jobId) {
        const jobPath = path.join(this.companiesPath, company, 'job-descriptions', `${jobId}.json`);
        
        if (!fs.existsSync(jobPath)) {
            throw new Error(`Job description not found: ${jobPath}`);
        }
        
        return JSON.parse(fs.readFileSync(jobPath, 'utf8'));
    }

    /**
     * Get all job descriptions for a company
     */
    getCompanyJobs(company) {
        const jobsPath = path.join(this.companiesPath, company, 'job-descriptions');
        
        if (!fs.existsSync(jobsPath)) {
            return [];
        }
        
        return fs.readdirSync(jobsPath)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const jobData = JSON.parse(fs.readFileSync(path.join(jobsPath, file), 'utf8'));
                return {
                    filename: file,
                    jobId: jobData.jobId,
                    title: jobData.metadata.title,
                    level: jobData.metadata.level,
                    department: jobData.metadata.department
                };
            });
    }

    /**
     * Extract keywords from job description for resume optimization
     */
    extractKeywords(jobDescription) {
        const keywords = new Set();
        
        // Technical keywords
        if (jobDescription.technicalStack) {
            Object.values(jobDescription.technicalStack).flat().forEach(tech => {
                keywords.add(tech.toLowerCase());
            });
        }
        
        // Requirement keywords
        jobDescription.requirements.essential.forEach(req => {
            this.extractKeywordsFromText(req).forEach(kw => keywords.add(kw));
        });
        
        // Responsibility keywords
        jobDescription.responsibilities.forEach(resp => {
            this.extractKeywordsFromText(resp).forEach(kw => keywords.add(kw));
        });
        
        // Explicit keywords
        if (jobDescription.keywords) {
            Object.values(jobDescription.keywords).flat().forEach(kw => {
                keywords.add(kw.toLowerCase());
            });
        }
        
        return Array.from(keywords);
    }

    /**
     * Extract keywords from text using simple NLP
     */
    extractKeywordsFromText(text) {
        // Simple keyword extraction - could be enhanced with proper NLP
        const technicalTerms = /\b(java|python|javascript|react|angular|aws|azure|kubernetes|docker|microservices|agile|scrum|devops|ci\/cd|sql|nosql|api|rest|graphql|machine learning|ai|blockchain|cloud|distributed systems|scalability|performance|security)\b/gi;
        
        const matches = text.match(technicalTerms) || [];
        return matches.map(match => match.toLowerCase());
    }

    /**
     * Calculate job-resume match score
     */
    calculateMatchScore(userResume, jobDescription) {
        const jobKeywords = this.extractKeywords(jobDescription);
        const resumeKeywords = this.extractResumeKeywords(userResume);
        
        const matchedKeywords = jobKeywords.filter(jkw => 
            resumeKeywords.some(rkw => rkw.includes(jkw) || jkw.includes(rkw))
        );
        
        const matchScore = matchedKeywords.length / jobKeywords.length;
        
        return {
            score: Math.round(matchScore * 100),
            matchedKeywords,
            missingKeywords: jobKeywords.filter(jkw => 
                !resumeKeywords.some(rkw => rkw.includes(jkw) || jkw.includes(rkw))
            ),
            totalJobKeywords: jobKeywords.length,
            totalMatches: matchedKeywords.length
        };
    }

    /**
     * Extract keywords from user resume
     */
    extractResumeKeywords(resume) {
        const keywords = new Set();
        
        // Skills
        if (resume.skills) {
            resume.skills.forEach(skill => {
                if (skill.keywords) {
                    skill.keywords.forEach(kw => keywords.add(kw.toLowerCase()));
                }
            });
        }
        
        // Work experience
        if (resume.work) {
            resume.work.forEach(job => {
                if (job.highlights) {
                    job.highlights.forEach(highlight => {
                        this.extractKeywordsFromText(highlight).forEach(kw => keywords.add(kw));
                    });
                }
                if (job.summary) {
                    this.extractKeywordsFromText(job.summary).forEach(kw => keywords.add(kw));
                }
            });
        }
        
        return Array.from(keywords);
    }

    /**
     * Generate tailored resume suggestions
     */
    generateResumeSuggestions(userResume, jobDescription) {
        const matchAnalysis = this.calculateMatchScore(userResume, jobDescription);
        
        const suggestions = {
            overallMatch: matchAnalysis.score,
            strengthAreas: [],
            improvementAreas: [],
            keywordRecommendations: [],
            experienceHighlights: []
        };

        // Analyze technical requirements
        const requiredTech = jobDescription.technicalStack || {};
        Object.entries(requiredTech).forEach(([category, technologies]) => {
            const userTech = this.getUserTechnologies(userResume, category);
            const matches = technologies.filter(tech => 
                userTech.some(userT => userT.toLowerCase().includes(tech.toLowerCase()))
            );
            
            if (matches.length > 0) {
                suggestions.strengthAreas.push({
                    category,
                    matches,
                    percentage: Math.round((matches.length / technologies.length) * 100)
                });
            }
            
            const missing = technologies.filter(tech => 
                !userTech.some(userT => userT.toLowerCase().includes(tech.toLowerCase()))
            );
            
            if (missing.length > 0) {
                suggestions.keywordRecommendations.push({
                    category,
                    missing: missing.slice(0, 3) // Top 3 missing
                });
            }
        });

        return suggestions;
    }

    /**
     * Get user technologies by category
     */
    getUserTechnologies(resume, category) {
        if (!resume.skills) return [];
        
        const categoryMap = {
            'languages': ['programming', 'language'],
            'frameworks': ['framework', 'library'],
            'databases': ['database', 'data'],
            'cloud': ['cloud', 'platform'],
            'tools': ['tool', 'software']
        };
        
        const searchTerms = categoryMap[category.toLowerCase()] || [category.toLowerCase()];
        
        return resume.skills
            .filter(skill => searchTerms.some(term => 
                skill.name.toLowerCase().includes(term)
            ))
            .flatMap(skill => skill.keywords || []);
    }

    /**
     * Save job description analysis
     */
    saveJobAnalysis(company, jobId, userId, analysis) {
        const analysisPath = path.join(__dirname, '..', 'users', userId, 'analysis');
        
        if (!fs.existsSync(analysisPath)) {
            fs.mkdirSync(analysisPath, { recursive: true });
        }
        
        const filename = `${company}-${jobId}-analysis.json`;
        const data = {
            company,
            jobId,
            userId,
            analysisDate: new Date().toISOString(),
            ...analysis
        };
        
        fs.writeFileSync(
            path.join(analysisPath, filename),
            JSON.stringify(data, null, 2)
        );
    }
}

module.exports = JobDescriptionProcessor;
