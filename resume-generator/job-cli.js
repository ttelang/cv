#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const JobDescriptionProcessor = require('./job-description-processor');

class JobCLI {
    constructor() {
        this.processor = new JobDescriptionProcessor();
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'list':
                this.listJobs(args[1]);
                break;
            case 'analyze':
                this.analyzeMatch(args[1], args[2], args[3]); // user, company, jobId
                break;
            case 'suggest':
                this.generateSuggestions(args[1], args[2], args[3]);
                break;
            case 'keywords':
                this.extractJobKeywords(args[1], args[2]);
                break;
            case 'validate':
                this.validateJobDescription(args[1], args[2]);
                break;
            default:
                this.showHelp();
        }
    }

    listJobs(company) {
        if (!company) {
            console.log('Available companies:');
            const companiesPath = path.join(__dirname, '..', 'companies');
            fs.readdirSync(companiesPath).forEach(comp => {
                const jobs = this.processor.getCompanyJobs(comp);
                console.log(`  ${comp}: ${jobs.length} jobs`);
            });
            return;
        }

        const jobs = this.processor.getCompanyJobs(company);
        console.log(`\nJobs at ${company}:`);
        jobs.forEach(job => {
            console.log(`  • ${job.title} (${job.level}) - ${job.filename}`);
        });
    }

    analyzeMatch(userId, company, jobId) {
        try {
            // Load user resume
            const userPath = path.join(__dirname, '..', 'users', userId, 'resume.json');
            if (!fs.existsSync(userPath)) {
                console.error(`User resume not found: ${userPath}`);
                return;
            }
            
            const userResume = JSON.parse(fs.readFileSync(userPath, 'utf8'));
            const jobDescription = this.processor.loadJobDescription(company, jobId);
            
            const matchAnalysis = this.processor.calculateMatchScore(userResume, jobDescription);
            
            console.log(`\n📊 Job Match Analysis`);
            console.log(`User: ${userId}`);
            console.log(`Position: ${jobDescription.metadata.title} at ${company}`);
            console.log(`Match Score: ${matchAnalysis.score}%`);
            console.log(`\n✅ Matched Keywords (${matchAnalysis.totalMatches}):`);
            matchAnalysis.matchedKeywords.slice(0, 10).forEach(kw => console.log(`  • ${kw}`));
            
            console.log(`\n❌ Missing Keywords (${matchAnalysis.missingKeywords.length}):`);
            matchAnalysis.missingKeywords.slice(0, 10).forEach(kw => console.log(`  • ${kw}`));
            
            // Save analysis
            this.processor.saveJobAnalysis(company, jobId, userId, matchAnalysis);
            console.log(`\n💾 Analysis saved to users/${userId}/analysis/`);
            
        } catch (error) {
            console.error('Error analyzing job match:', error.message);
        }
    }

    generateSuggestions(userId, company, jobId) {
        try {
            const userPath = path.join(__dirname, '..', 'users', userId, 'resume.json');
            const userResume = JSON.parse(fs.readFileSync(userPath, 'utf8'));
            const jobDescription = this.processor.loadJobDescription(company, jobId);
            
            const suggestions = this.processor.generateResumeSuggestions(userResume, jobDescription);
            
            console.log(`\n🎯 Resume Optimization Suggestions`);
            console.log(`Overall Match: ${suggestions.overallMatch}%`);
            
            console.log(`\n💪 Strength Areas:`);
            suggestions.strengthAreas.forEach(area => {
                console.log(`  • ${area.category}: ${area.percentage}% match`);
                console.log(`    Matches: ${area.matches.join(', ')}`);
            });
            
            console.log(`\n🔧 Improvement Areas:`);
            suggestions.keywordRecommendations.forEach(rec => {
                console.log(`  • ${rec.category}: Consider adding ${rec.missing.join(', ')}`);
            });
            
        } catch (error) {
            console.error('Error generating suggestions:', error.message);
        }
    }

    extractJobKeywords(company, jobId) {
        try {
            const jobDescription = this.processor.loadJobDescription(company, jobId);
            const keywords = this.processor.extractKeywords(jobDescription);
            
            console.log(`\n🔍 Keywords for ${jobDescription.metadata.title}`);
            console.log(`Total keywords: ${keywords.length}`);
            console.log('\nKeywords:');
            keywords.forEach(kw => console.log(`  • ${kw}`));
            
        } catch (error) {
            console.error('Error extracting keywords:', error.message);
        }
    }

    validateJobDescription(company, jobId) {
        try {
            const jobDescription = this.processor.loadJobDescription(company, jobId);
            const config = JSON.parse(fs.readFileSync(
                path.join(__dirname, '..', 'config', 'job-description-config.json'), 'utf8'
            ));
            
            const required = config.jobDescriptionConfig.defaultFields.required;
            const missing = required.filter(field => !jobDescription[field]);
            
            console.log(`\n✅ Validation Results for ${jobId}`);
            if (missing.length === 0) {
                console.log('✅ All required fields present');
            } else {
                console.log('❌ Missing required fields:');
                missing.forEach(field => console.log(`  • ${field}`));
            }
            
            // Additional validations
            if (jobDescription.responsibilities && jobDescription.responsibilities.length > 10) {
                console.log('⚠️  Too many responsibilities (max 10)');
            }
            
            if (jobDescription.requirements && jobDescription.requirements.essential.length > 15) {
                console.log('⚠️  Too many essential requirements (max 15)');
            }
            
        } catch (error) {
            console.error('Error validating job description:', error.message);
        }
    }

    showHelp() {
        console.log(`
📋 Job Description Management CLI

Usage: node job-cli.js <command> [options]

Commands:
  list [company]                    List all jobs or jobs for specific company
  analyze <user> <company> <jobId>  Analyze job-resume match
  suggest <user> <company> <jobId>  Generate resume optimization suggestions  
  keywords <company> <jobId>        Extract keywords from job description
  validate <company> <jobId>        Validate job description format

Examples:
  node job-cli.js list jpmorgan-chase
  node job-cli.js analyze tarun jpmorgan-chase director-engineering
  node job-cli.js suggest tarun microsoft principal-engineer
  node job-cli.js keywords jpmorgan-chase director-engineering
        `);
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new JobCLI();
    cli.run();
}

module.exports = JobCLI;
