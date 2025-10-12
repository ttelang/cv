# Proposed CV Repository Folder Structure

## 🎯 Design Goals
- **Scalable**: Support multiple users and family members
- **Flexible**: Multiple themes and output formats
- **Reusable**: Common resume generator for all users
- **Organized**: Clear separation of concerns
- **Maintainable**: Easy to add new users, themes, and companies

## 📁 Recommended Folder Structure

```
/workspaces/cv/
├── README.md                           # Project documentation
├── package.json                        # Build scripts and dependencies
├── 
├── resume-generator/                   # 🔧 SHARED GENERATOR SYSTEM
│   ├── resume-generator.js             # Core generator class
│   ├── build-resume.js                 # Build automation script
│   ├── resume-dynamic.html             # Interactive viewer
│   ├── themes/                         # Theme definitions
│   │   ├── jpmc.css                    # JPMorgan Chase theme
│   │   ├── oreilly.css                 # O'Reilly theme
│   │   ├── standard.css                # Standard professional theme
│   │   ├── tech.css                    # Technology focused theme
│   │   └── finance.css                 # Finance industry theme
│   └── templates/                      # HTML templates
│       ├── standard.html               # Standard resume template
│       ├── tech.html                   # Technical resume template
│       └── executive.html              # Executive level template
│
├── users/                              # 👥 USER DATA
│   ├── tarun/                          # Individual user folder
│   │   ├── profile/                    # Personal information
│   │   │   ├── basic-info.json         # Name, contact, summary
│   │   │   ├── linkedin-export.pdf     # LinkedIn profile backup
│   │   │   └── skills.json             # Technical skills, certifications
│   │   ├── experience/                 # Work experience data
│   │   │   ├── companies/              # Per-company data
│   │   │   │   ├── microsoft.json      # Microsoft experience
│   │   │   │   ├── oracle.json         # Oracle experience
│   │   │   │   ├── polycom.json        # Polycom experience
│   │   │   │   └── sap-labs.json       # SAP Labs experience
│   │   │   └── positions/              # Specific role data
│   │   │       ├── director-jpmc.json  # Director role at JPMC
│   │   │       ├── senior-manager.json # Senior Manager roles
│   │   │       └── tech-lead.json      # Technical lead positions
│   │   ├── education/                  # Education data
│   │   │   ├── degrees.json            # University degrees
│   │   │   └── certifications.json     # Professional certifications
│   │   ├── projects/                   # Project portfolio
│   │   │   ├── publications.json       # Books, articles, papers
│   │   │   ├── open-source.json        # GitHub projects
│   │   │   └── speaking.json           # Conferences, talks
│   │   ├── resumes/                    # Generated output
│   │   │   ├── tarun-jpmc-director.html     # Target-specific resumes
│   │   │   ├── tarun-tech-lead.html         # Role-specific versions
│   │   │   ├── tarun-oreilly-author.html    # Industry-specific
│   │   │   └── archive/                     # Historical versions
│   │   └── master-resume.json          # Compiled JSON Resume schema
│   │
│   ├── kriti/                          # Another family member
│   │   ├── profile/
│   │   ├── experience/
│   │   ├── education/
│   │   ├── projects/
│   │   ├── resumes/
│   │   └── master-resume.json
│   │
│   └── [other-family-members]/         # Extensible for new users
│
├── companies/                          # 🏢 COMPANY/ORGANIZATION DATA
│   ├── jpmorgan-chase/                 # Target company information
│   │   ├── company-info.json           # Values, culture, requirements
│   │   ├── job-descriptions/           # Specific role requirements
│   │   │   ├── director-engineering.json
│   │   │   ├── senior-manager.json
│   │   │   └── principal-engineer.json
│   │   ├── themes/                     # Company-specific themes
│   │   │   ├── colors.json             # Brand colors
│   │   │   └── styling.json            # Formatting preferences
│   │   └── keywords.json               # Industry keywords, terminology
│   │
│   ├── microsoft/
│   ├── oracle/
│   ├── google/
│   └── [other-companies]/
│
├── shared/                             # 📚 SHARED RESOURCES
│   ├── images/                         # Common images
│   │   ├── books/                      # Book covers
│   │   ├── logos/                      # Company logos
│   │   ├── certifications/             # Certification badges
│   │   └── profiles/                   # Profile photos
│   ├── templates/                      # Document templates
│   │   ├── cover-letter.html           # Cover letter templates
│   │   └── portfolio.html              # Portfolio templates
│   └── data/                           # Reference data
│       ├── industries.json             # Industry classifications
│       ├── skills-taxonomy.json        # Standardized skill names
│       └── job-levels.json             # Role hierarchy definitions
│
└── config/                             # ⚙️ CONFIGURATION
    ├── build-config.json               # Build system configuration
    ├── theme-mapping.json              # Theme to company mappings
    └── user-profiles.json              # User-specific preferences
```

## 🔄 Build System Enhancement

### Enhanced package.json scripts:
```json
{
  "scripts": {
    "build:user": "node resume-generator/build-resume.js --user",
    "build:tarun:jpmc": "node resume-generator/build-resume.js --user=tarun --target=jpmc --role=director",
    "build:tarun:tech": "node resume-generator/build-resume.js --user=tarun --theme=tech",
    "build:kriti:lloyds": "node resume-generator/build-resume.js --user=kriti --target=lloyds",
    "build:all": "node resume-generator/build-resume.js --all-users",
    "compile:json": "node resume-generator/compile-resume.js --user=tarun",
    "validate": "node resume-generator/validate-data.js"
  }
}
```

## 🎨 Theme System

### Theme Configuration (theme-mapping.json):
```json
{
  "jpmorgan-chase": {
    "theme": "finance",
    "colors": {
      "primary": "#dc382d",
      "accent": "#856404"
    },
    "keywords": ["financial services", "risk management", "compliance"]
  },
  "microsoft": {
    "theme": "tech",
    "colors": {
      "primary": "#0078d4",
      "accent": "#005a9e"
    },
    "keywords": ["cloud", "AI", "enterprise"]
  }
}
```

## 📊 Data Compilation Process

1. **Data Collection**: Gather from profile/, experience/, education/, projects/
2. **Company Targeting**: Merge with companies/{target}/job-descriptions/
3. **Theme Application**: Apply theme from companies/{target}/themes/
4. **JSON Compilation**: Create master-resume.json following JSON Resume schema
5. **HTML Generation**: Use resume-generator with compiled data
6. **Output**: Store in users/{name}/resumes/

## 🔧 Enhanced Build Features

### Multi-target Resume Generation:
```bash
# Generate JPMC-targeted resume for Tarun
npm run build:tarun:jpmc

# Generate all resumes for a user
npm run build:user tarun

# Generate resumes for all users
npm run build:all
```

### Data Validation:
```bash
# Validate user data completeness
npm run validate --user=tarun

# Check JSON Resume schema compliance
npm run validate --schema
```

## 🎯 Benefits of This Structure

1. **Scalability**: Easy to add new users, companies, themes
2. **Reusability**: Common generator works for everyone
3. **Customization**: Company-specific targeting and theming
4. **Maintainability**: Clear separation of data, logic, and output
5. **Collaboration**: Multiple family members can work independently
6. **Version Control**: Track changes to individual components
7. **Automation**: Build system handles complexity

## 🚀 Migration Path

1. Move existing tarun/ data into users/tarun/ structure
2. Extract company data into companies/ folders
3. Create theme files in resume-generator/themes/
4. Enhance build script to support new structure
5. Migrate kriti/ data to new structure
6. Add new users as needed

This structure provides a professional, scalable foundation for managing multiple resumes while maintaining the flexibility to target different roles and companies!
