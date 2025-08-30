/**
 * Resume Generator - Dynamically generates HTML resumes from JSON data
 * Usage: Include this script in your HTML file and call generateResume()
 */

class ResumeGenerator {
    constructor(jsonPath) {
        this.jsonPath = jsonPath;
        this.resumeData = null;
    }

    async loadResumeData() {
        try {
            const response = await fetch(this.jsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.resumeData = await response.json();
            return this.resumeData;
        } catch (error) {
            console.error('Error loading resume data:', error);
            throw error;
        }
    }

    generateHeader(basics) {
        const { name, label, email, phone, profiles, location } = basics;
        const linkedinProfile = profiles?.find(p => p.network.toLowerCase() === 'linkedin');
        
        return `
            <div class="header">
                <h1>${name}</h1>
                <div class="tagline">${label}</div>
                <div class="contact-info">
                    <span><strong>Email:</strong> ${email}</span>
                    <span><strong>Phone:</strong> ${phone}</span>
                    ${linkedinProfile ? `<span><strong>LinkedIn:</strong> ${linkedinProfile.url.replace('https://', '')}</span>` : ''}
                    ${location ? `<span><strong>Location:</strong> ${location.city}, ${location.region}</span>` : ''}
                </div>
            </div>
        `;
    }

    generateSummary(summary) {
        if (!summary) return '';
        return `
            <div class="summary">
                <p>${summary}</p>
            </div>
        `;
    }

    generateSkills(skills) {
        if (!skills || skills.length === 0) return '';
        
        const skillsGrid = skills.map(skill => `
            <div class="skill-category">
                <h3>${skill.name}</h3>
                <p>${skill.keywords.join(', ')}</p>
            </div>
        `).join('');

        return `
            <div class="section">
                <h2>Core Technical Expertise</h2>
                <div class="skills-section">
                    <div class="skills-grid">
                        ${skillsGrid}
                    </div>
                </div>
            </div>
        `;
    }

    generateWorkExperience(work) {
        if (!work || work.length === 0) return '';
        
        const jobs = work.map(job => {
            const startDate = new Date(job.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const endDate = job.endDate ? new Date(job.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Present';
            
            const highlights = job.highlights?.map(highlight => `<li>${highlight}</li>`).join('') || '';
            
            return `
                <div class="job">
                    <div class="job-header">
                        <div class="job-title">${job.position}</div>
                        <div class="company">${job.name}</div>
                        <div class="job-details">${startDate} – ${endDate}</div>
                    </div>
                    ${highlights ? `<ul>${highlights}</ul>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="section">
                <h2>Professional Experience</h2>
                ${jobs}
            </div>
        `;
    }

    generateEducation(education) {
        if (!education || education.length === 0) return '';
        
        const educationItems = education.map(edu => {
            const startYear = edu.startDate ? new Date(edu.startDate).getFullYear() : '';
            const endYear = edu.endDate ? new Date(edu.endDate).getFullYear() : '';
            const dateRange = startYear && endYear ? `${startYear} - ${endYear}` : '';
            
            return `
                <div class="education-item">
                    <div class="degree">${edu.studyType} in ${edu.area}</div>
                    <div class="institution">${edu.institution}</div>
                    ${dateRange ? `<div class="dates">${dateRange}</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="section">
                <h2>Education</h2>
                ${educationItems}
            </div>
        `;
    }

    generatePublications(publications) {
        if (!publications || publications.length === 0) return '';
        
        const pubItems = publications.map(pub => {
            const releaseYear = pub.releaseDate ? new Date(pub.releaseDate).getFullYear() : '';
            
            return `
                <div class="book-item">
                    ${pub.image ? `<img src="${pub.image}" alt="${pub.name}" class="book-cover">` : ''}
                    <div class="book-details">
                        <div class="book-title">${pub.name}</div>
                        <div class="book-publisher">${pub.publisher}${releaseYear ? ` • ${releaseYear}` : ''}</div>
                        ${pub.summary ? `<div class="book-summary">${pub.summary}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="books-section">
                <h2>Published Works</h2>
                ${pubItems}
            </div>
        `;
    }

    generateAwards(awards) {
        if (!awards || awards.length === 0) return '';
        
        const awardItems = awards.map(award => {
            const awardYear = award.date ? new Date(award.date).getFullYear() : '';
            return `<li>${award.title} - ${award.awarder}${awardYear ? ` (${awardYear})` : ''}</li>`;
        }).join('');

        return `
            <div class="achievement-box">
                <h3>Awards & Recognition</h3>
                <ul>${awardItems}</ul>
            </div>
        `;
    }

    generatePatents(patents) {
        if (!patents || patents.length === 0) return '';
        
        const patentItems = patents.map(patent => `<li>${patent.title}</li>`).join('');

        return `
            <div class="achievement-box">
                <h3>Patents & Intellectual Property</h3>
                <ul>${patentItems}</ul>
            </div>
        `;
    }

    getDefaultStyles() {
        return `
        <style>
            body {
                font-family: 'Fira Sans', 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.3;
                color: #333;
                max-width: 9.35in;
                margin: 0 auto;
                padding: 0.5in;
                background: white;
                font-size: 12pt;
            }

            .header {
                border-top: 4px solid #dc382d;
                padding-top: 10px;
                margin-bottom: 15px;
                text-align: left;
            }

            .header h1 {
                font-size: 24pt;
                color: #333;
                font-weight: 300;
                margin-bottom: 5px;
                font-family: 'Fira Sans', sans-serif;
                letter-spacing: -0.5px;
            }

            .tagline {
                font-size: 14pt;
                color: #dc382d;
                font-weight: 400;
                margin-bottom: 8px;
                font-style: italic;
            }

            .contact-info {
                display: flex;
                flex-wrap: nowrap;
                gap: 30px;
                font-size: 11pt;
                color: #666;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 8px;
                white-space: nowrap;
                overflow: hidden;
            }

            .contact-info span {
                display: flex;
                align-items: center;
            }

            .contact-info strong {
                color: #333;
                margin-right: 5px;
            }

            .summary {
                margin: 10px 0;
                padding: 12px;
                background: #f8f9fa;
                border-left: 4px solid #dc382d;
                font-style: italic;
                line-height: 1.3;
            }

            .summary p {
                font-size: 12pt;
                color: #444;
            }

            .section {
                margin-bottom: 15px;
            }

            .section h2 {
                font-size: 16pt;
                color: #dc382d;
                font-weight: 600;
                margin-bottom: 8px;
                border-bottom: 2px solid #dc382d;
                padding-bottom: 2px;
                display: inline-block;
                font-family: 'Fira Sans', sans-serif;
            }

            .job {
                margin-bottom: 12px;
                border-left: 3px solid #f0f0f0;
                padding-left: 15px;
                position: relative;
            }

            .job::before {
                content: '';
                position: absolute;
                left: -6px;
                top: 0;
                width: 9px;
                height: 9px;
                background: #dc382d;
                border-radius: 50%;
            }

            .job-header {
                margin-bottom: 4px;
            }

            .job-title {
                font-size: 14pt;
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
            }

            .company {
                font-size: 12pt;
                color: #dc382d;
                font-weight: 500;
                margin-bottom: 2px;
            }

            .job-details {
                font-size: 11pt;
                color: #666;
                font-style: italic;
                margin-bottom: 6px;
            }

            .job ul {
                list-style: none;
                margin-left: 0;
            }

            .job li {
                margin-bottom: 3px;
                padding-left: 15px;
                position: relative;
                line-height: 1.3;
                font-size: 12pt;
            }

            .job li::before {
                content: '▶';
                position: absolute;
                left: 0;
                color: #dc382d;
                font-size: 11pt;
                top: 2px;
            }

            .skills-section {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 12px;
            }

            .skills-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 8px;
            }

            .skill-category {
                background: white;
                padding: 10px;
                border-radius: 6px;
                border-left: 4px solid #dc382d;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }

            .skill-category h3 {
                font-size: 12pt;
                font-weight: 600;
                color: #333;
                margin-bottom: 4px;
            }

            .skill-category p {
                font-size: 11pt;
                color: #666;
                line-height: 1.2;
            }

            .achievement-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 12px;
                margin: 15px 0;
            }

            .achievement-box h3 {
                color: #856404;
                font-size: 14pt;
                margin-bottom: 6px;
                font-weight: 600;
            }

            .achievement-box ul {
                list-style: none;
            }

            .achievement-box li {
                margin-bottom: 3px;
                padding-left: 15px;
                position: relative;
                font-size: 11pt;
                color: #856404;
            }

            .achievement-box li::before {
                content: '★';
                position: absolute;
                left: 0;
                color: #ffc107;
            }

            .books-section {
                background: #e8f4fd;
                border: 1px solid #b8daff;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
            }

            .books-section h2 {
                color: #0c5aa6;
                border-bottom-color: #0c5aa6;
            }

            .book-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 15px;
                padding: 10px;
                background: white;
                border-radius: 6px;
                border-left: 3px solid #0c5aa6;
            }

            .book-cover {
                width: 60px;
                height: 80px;
                object-fit: cover;
                margin-right: 15px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .book-title {
                font-weight: 600;
                color: #333;
                font-size: 12pt;
                margin-bottom: 2px;
            }

            .book-publisher {
                font-size: 11pt;
                color: #666;
                font-style: italic;
                margin-bottom: 4px;
            }

            .book-summary {
                font-size: 10pt;
                color: #555;
                line-height: 1.3;
            }

            .education-item {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
                border-left: 4px solid #dc382d;
            }

            .degree {
                font-weight: 600;
                color: #333;
                font-size: 14pt;
                margin-bottom: 3px;
            }

            .institution {
                color: #dc382d;
                font-size: 12pt;
                margin-bottom: 2px;
            }

            .dates {
                color: #666;
                font-size: 11pt;
                font-style: italic;
            }

            @media print {
                body {
                    padding: 0.5in;
                    font-size: 10pt;
                }
                
                .header h1 {
                    font-size: 20pt;
                }
                
                .section {
                    margin-bottom: 12px;
                }
                
                .skills-grid {
                    grid-template-columns: 1fr 1fr;
                }
                
                .book-item {
                    display: block;
                }
                
                .book-cover {
                    width: 40px;
                    height: 50px;
                    float: left;
                    margin-right: 10px;
                }
            }

            @page {
                margin: 0.5in;
                size: letter;
            }
        </style>
        `;
    }

    async generateHTML(includeStyles = true, customPatents = null) {
        if (!this.resumeData) {
            await this.loadResumeData();
        }

        const { basics, skills, work, education, publications, awards } = this.resumeData;
        
        const styles = includeStyles ? this.getDefaultStyles() : '';
        const header = this.generateHeader(basics);
        const summary = this.generateSummary(basics.summary);
        const skillsSection = this.generateSkills(skills);
        const workSection = this.generateWorkExperience(work);
        const educationSection = this.generateEducation(education);
        const publicationsSection = this.generatePublications(publications);
        const awardsSection = this.generateAwards(awards);
        const patentsSection = customPatents ? this.generatePatents(customPatents) : '';

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${basics.name} - Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
    ${styles}
</head>
<body>
    ${header}
    ${summary}
    ${skillsSection}
    ${workSection}
    ${publicationsSection}
    ${educationSection}
    ${awardsSection}
    ${patentsSection}
    
    <div class="footer">
        <p>Generated from JSON Resume data - ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
        `.trim();
    }
}

// Global function for easy usage
window.ResumeGenerator = ResumeGenerator;

// Usage example:
async function generateResume(jsonPath = '../resume-jpmc-director.json', containerId = 'resume-container') {
    try {
        const generator = new ResumeGenerator(jsonPath);
        const html = await generator.generateHTML(false); // Don't include styles if container already has them
        
        const container = document.getElementById(containerId);
        if (container) {
            // Extract body content only
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            const bodyContent = bodyMatch ? bodyMatch[1] : html;
            container.innerHTML = bodyContent;
        } else {
            console.error(`Container with ID '${containerId}' not found`);
        }
    } catch (error) {
        console.error('Error generating resume:', error);
    }
}

// Auto-generate if container exists
document.addEventListener('DOMContentLoaded', function() {
    const resumeContainer = document.getElementById('resume-container');
    if (resumeContainer) {
        const jsonPath = resumeContainer.dataset.jsonPath || './resume-jpmc-director.json';
        generateResume(jsonPath, 'resume-container');
    }
});
