# 📄 Dynamic Resume Generator

A JavaScript-based resume generator that creates professional HTML resumes from JSON Resume schema data. This system maintains a single source of truth in JSON format and dynamically generates styled HTML outputs.

## 🎯 Features

- **Single Source of Truth**: All resume data stored in JSON format
- **Multiple Themes**: JPMC Director, Standard Professional, O'Reilly Technical
- **Dynamic Generation**: Real-time HTML generation from JSON data
- **Print Optimized**: Professional print layouts with proper page breaks
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Easy Maintenance**: Update JSON once, reflects in all formats

## 🚀 Quick Start

### Method 1: Dynamic Loading (Recommended)
```bash
# Start local server
python3 -m http.server 8000

# Visit in browser
http://localhost:8000/resume-dynamic.html
```

### Method 2: Build Static Files
```bash
# Build all themes
npm run build

# Build specific theme
npm run build:jpmc
npm run build:standard
npm run build:oreilly

# Serve built files
npm run serve
```

### Method 3: Development Mode
```bash
# Build JPMC theme and serve
npm run dev
```

## 📁 File Structure

```
cv/
├── resume-generator.js          # Core generator class
├── build-resume.js             # Build script for static generation
├── package.json                # NPM scripts and dependencies
├── resume-dynamic.html         # Dynamic loading template
├── resume-jpmc-director.json   # JPMC-specific resume data
├── resume.json                 # Standard resume data
└── generated files:
    ├── resume-jpmc-generated.html
    ├── resume-standard-generated.html
    └── resume-oreilly-generated.html
```

## 🎨 Available Themes

### 1. JPMorgan Chase Director (`jpmc`)
- **Primary Color**: #dc382d (JPMC Red)
- **Target**: Financial services director roles
- **Features**: Banking terminology, compliance focus
- **JSON Source**: `resume-jpmc-director.json`

### 2. Standard Professional (`standard`)
- **Primary Color**: #2563eb (Professional Blue)
- **Target**: General corporate roles
- **Features**: Clean, versatile design
- **JSON Source**: `resume.json`

### 3. O'Reilly Technical (`oreilly`)
- **Primary Color**: #ff6b35 (O'Reilly Orange)
- **Target**: Technical/publishing roles
- **Features**: Gradient header, technical focus
- **JSON Source**: `resume.json`

## 🔧 Usage Examples

### Basic Usage
```javascript
// Create generator instance
const generator = new ResumeGenerator('./resume-jpmc-director.json');

// Generate complete HTML
const html = await generator.generateHTML();

// Load into container
document.getElementById('container').innerHTML = html;
```

### Advanced Usage
```javascript
// Load data first
await generator.loadResumeData();

// Generate sections individually
const header = generator.generateHeader(generator.resumeData.basics);
const skills = generator.generateSkills(generator.resumeData.skills);
const work = generator.generateWorkExperience(generator.resumeData.work);

// Custom patents
const patents = [
    { title: 'My Patent Title' }
];
const html = await generator.generateHTML(true, patents);
```

### Auto-Loading Template
```html
<!-- Container with data attributes -->
<div id="resume-container" data-json-path="./resume-jpmc-director.json">
    Loading...
</div>

<!-- Include generator -->
<script src="resume-generator.js"></script>
```

## 📊 JSON Resume Schema

The generator uses the standard JSON Resume schema v1.0.0:

```json
{
  "$schema": "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
  "basics": {
    "name": "Your Name",
    "label": "Your Title",
    "email": "email@example.com",
    "phone": "+1-555-0123",
    "summary": "Professional summary...",
    "profiles": [
      {
        "network": "LinkedIn",
        "url": "https://linkedin.com/in/yourprofile"
      }
    ]
  },
  "skills": [...],
  "work": [...],
  "education": [...],
  "publications": [...],
  "awards": [...]
}
```

## 🎯 Customization

### Adding New Themes
1. Edit `build-resume.js`
2. Add theme configuration:
```javascript
mytheme: {
    name: 'My Custom Theme',
    jsonFile: 'resume.json',
    primaryColor: '#your-color',
    accentColor: '#accent-color',
    booksColor: '#books-color'
}
```

### Custom CSS
Modify the `generateThemedCSS()` method in `build-resume.js` or override styles in your template.

### Additional Sections
Extend the `ResumeGenerator` class by adding new methods:
```javascript
generateCustomSection(data) {
    // Your custom section logic
}
```

## 📱 Print Optimization

The generated resumes include print-optimized CSS:
- Proper page margins (0.5in)
- Print-friendly font sizes
- Page break controls
- Optimized layouts for letter-size paper

## 🔄 Build Pipeline

```bash
JSON Resume Data → Generator Class → Themed CSS → HTML Output
```

1. **JSON Source**: Structured resume data
2. **Generator**: JavaScript class processes data
3. **Themes**: CSS styling with color variables
4. **Output**: Professional HTML resumes

## 🚀 Deployment

### Static Hosting
```bash
npm run build
# Deploy generated HTML files to any static host
```

### Dynamic Hosting
```bash
# Serve with any HTTP server
python3 -m http.server 8000
# or
npx serve .
```

## 📄 Generated Output

Each generated resume includes:
- Professional header with contact information
- Executive summary
- Skills matrix with categorization
- Chronological work experience
- Published works with book covers
- Education background
- Awards and recognition
- Patents and intellectual property

## 🎉 Benefits

✅ **Maintainable**: Single JSON source of truth  
✅ **Scalable**: Easy to add new themes and sections  
✅ **Professional**: Print-ready, responsive designs  
✅ **Flexible**: Supports multiple output formats  
✅ **Version Controlled**: Track changes in Git  
✅ **Automated**: Build pipeline for consistent output  

## 📞 Support

For issues or customization requests, check the JSON Resume schema documentation or review the generator source code.

---

*Generated resumes automatically include a timestamp footer showing generation date.*
