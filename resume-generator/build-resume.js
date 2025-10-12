#!/usr/bin/env node

/**
 * Resume Build Script
 * Generates multiple themed HTML resumes from JSON data
 */

const fs = require('fs').promises;
const path = require('path');

class ResumeBuildScript {
    constructor() {
        this.themes = {
            jpmc: {
                name: 'JPMorgan Chase Director',
                jsonFile: '../resume-jpmc-director.json',
                primaryColor: '#dc382d',
                accentColor: '#856404',
                booksColor: '#0c5aa6'
            },
            standard: {
                name: 'Standard Professional',
                jsonFile: '../resume.json',
                primaryColor: '#2563eb',
                accentColor: '#7c3aed',
                booksColor: '#059669'
            },
            oreilly: {
                name: 'O\'Reilly Technical',
                jsonFile: '../resume.json',
                primaryColor: '#ff6b35',
                accentColor: '#1a365d',
                booksColor: '#2d3748'
            },
            proptech: {
                name: 'PropTech Blockchain Platform',
                jsonFile: '../tarun/resume-proptech-blockchain.json',
                primaryColor: '#1a202c',
                accentColor: '#3182ce',
                booksColor: '#38a169'
            }
        };
    }

    async loadTemplate() {
        const templatePath = path.join(__dirname, 'resume-generator.js');
        return await fs.readFile(templatePath, 'utf8');
    }

    generateThemedCSS(theme) {
        const { primaryColor, accentColor, booksColor } = this.themes[theme];
        
        return `
        <style>
            :root {
                --primary-color: ${primaryColor};
                --accent-color: ${accentColor};
                --books-color: ${booksColor};
            }
            
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
                border-top: 4px solid var(--primary-color);
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
                color: var(--primary-color);
                font-weight: 400;
                margin-bottom: 8px;
                font-style: italic;
            }

            .section h2 {
                font-size: 16pt;
                color: var(--primary-color);
                font-weight: 600;
                margin-bottom: 8px;
                border-bottom: 2px solid var(--primary-color);
                padding-bottom: 2px;
                display: inline-block;
                font-family: 'Fira Sans', sans-serif;
            }

            .job::before {
                background: var(--primary-color);
            }

            .job li::before {
                color: var(--primary-color);
            }

            .skill-category {
                border-left: 4px solid var(--primary-color);
            }

            .summary {
                border-left: 4px solid var(--primary-color);
            }

            .books-section h2 {
                color: var(--books-color);
                border-bottom-color: var(--books-color);
            }

            .book-item {
                border-left: 3px solid var(--books-color);
            }

            .achievement-box h3 {
                color: var(--accent-color);
            }

            .achievement-box li {
                color: var(--accent-color);
            }

            /* Theme-specific overrides */
            ${theme === 'oreilly' ? `
                .header {
                    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                    color: white;
                    border-top: none;
                    padding: 20px;
                    margin-bottom: 20px;
                    border-radius: 8px;
                }
                
                .header h1 {
                    color: white;
                }
                
                .tagline {
                    color: #fff3cd;
                }
            ` : ''}

            ${theme === 'standard' ? `
                .header {
                    border-top: 6px solid var(--primary-color);
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    padding: 15px;
                    border-radius: 0 0 8px 8px;
                }
            ` : ''}
        </style>
        `;
    }

    async generateResumeHTML(theme) {
        const themeConfig = this.themes[theme];
        const generatorScript = await this.loadTemplate();
        const themedCSS = this.generateThemedCSS(theme);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tarun Telang - ${themeConfig.name} Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
    ${themedCSS}
</head>
<body>
    <div id="resume-container" data-json-path="./${themeConfig.jsonFile}">
        <div class="loading">Loading ${themeConfig.name} resume...</div>
    </div>

    <script>
${generatorScript}

// Auto-load resume with patents for specific themes
document.addEventListener('DOMContentLoaded', async function() {
    const customPatents = [
        { title: 'Contextual Collaborative Electronic Annotations - Enterprise Communication Security' },
        { title: 'System and Method for Model-driven Unit Testing Environment - Financial System Quality Assurance' }
    ];
    
    try {
        const generator = new ResumeGenerator('./${themeConfig.jsonFile}');
        await generator.loadResumeData();
        
        // Generate HTML with patents for JPMC theme
        const includePatents = '${theme}' === 'jpmc';
        const html = await generator.generateHTML(false, includePatents ? customPatents : null);
        
        const bodyMatch = html.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : html;
        
        document.getElementById('resume-container').innerHTML = bodyContent;
    } catch (error) {
        console.error('Error generating ${themeConfig.name} resume:', error);
        document.getElementById('resume-container').innerHTML = 
            '<div class="error">Error loading resume. Please check the console for details.</div>';
    }
});
    </script>
</body>
</html>`;
    }

    async buildAll() {
        console.log('🚀 Building themed resumes...\n');

        for (const [themeKey, themeConfig] of Object.entries(this.themes)) {
            try {
                console.log(`📄 Generating ${themeConfig.name} resume...`);
                
                const html = await this.generateResumeHTML(themeKey);
                const outputFile = `resume-${themeKey}-generated.html`;
                
                await fs.writeFile(outputFile, html, 'utf8');
                console.log(`✅ Generated: ${outputFile}`);
                
            } catch (error) {
                console.error(`❌ Error generating ${themeConfig.name} resume:`, error);
            }
        }

        console.log('\n🎉 Resume generation complete!');
        console.log('\n📋 Generated files:');
        console.log('   • resume-jpmc-generated.html (JPMorgan Chase Director theme)');
        console.log('   • resume-standard-generated.html (Standard Professional theme)');
        console.log('   • resume-oreilly-generated.html (O\'Reilly Technical theme)');
        console.log('\n💡 To preview: python3 -m http.server 8000');
    }

    async buildSingle(theme) {
        if (!this.themes[theme]) {
            console.error(`❌ Unknown theme: ${theme}`);
            console.log('Available themes:', Object.keys(this.themes).join(', '));
            return;
        }

        try {
            const themeConfig = this.themes[theme];
            console.log(`📄 Generating ${themeConfig.name} resume...`);
            
            const html = await this.generateResumeHTML(theme);
            const outputFile = `resume-${theme}-generated.html`;
            
            await fs.writeFile(outputFile, html, 'utf8');
            console.log(`✅ Generated: ${outputFile}`);
            
        } catch (error) {
            console.error(`❌ Error generating ${themeConfig.name} resume:`, error);
        }
    }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const theme = args[1];

const builder = new ResumeBuildScript();

if (command === 'build') {
    if (theme) {
        builder.buildSingle(theme);
    } else {
        builder.buildAll();
    }
} else {
    console.log('📋 Resume Build Script');
    console.log('');
    console.log('Usage:');
    console.log('  node build-resume.js build          # Build all themes');
    console.log('  node build-resume.js build jpmc     # Build specific theme');
    console.log('');
    console.log('Available themes: jpmc, standard, oreilly');
}
