# CV Repository - New Folder Structure

This repository now follows the proposed professional folder structure for scalable, multi-user resume management.

## 📁 Directory Structure

```
├── users/                              # User-specific data
│   ├── tarun/                         # Individual user folders
│   │   ├── profile/                   # Personal information
│   │   ├── experience/                # Work history
│   │   ├── education/                 # Educational background
│   │   ├── projects/                  # Projects and achievements
│   │   └── resumes/                   # Generated output files
│   └── kriti/                         # Additional family members
│
├── companies/                         # Target company data
│   ├── jpmorgan-chase/               # Company-specific information
│   ├── microsoft/
│   ├── oracle/
│   └── google/
│
├── resume-generator/                  # Shared generator system
│   ├── themes/                       # CSS themes (standard, tech, finance)
│   ├── templates/                    # HTML templates
│   ├── resume-generator.js           # Core generation logic
│   └── build-resume.js               # Build automation
│
├── shared/                           # Common resources
│   ├── images/                       # Shared images and logos
│   ├── templates/                    # Document templates
│   └── data/                         # Reference data
│
└── config/                           # Configuration files
    ├── build-config.json            # Build system settings
    ├── theme-mapping.json           # Company theme mappings
    └── user-profiles.json           # User preferences
```

## 🚀 Quick Start

### Building Resumes

```bash
# Build for specific user and target
npm run build:tarun:jpmc

# Build with specific theme
npm run build:tarun:tech

# Build all resumes for all users
npm run build:all

# Validate user data
npm run validate
```

### Adding New Users

1. Create user directory: `users/{name}/`
2. Add subdirectories: `profile/`, `experience/`, `education/`, `projects/`, `resumes/`
3. Create `profile/basic-info.json` with personal data
4. Add to `config/user-profiles.json`

### Adding New Companies

1. Create company directory: `companies/{company-name}/`
2. Add `company-info.json` with company details
3. Add `keywords.json` with industry terms
4. Create `themes/` folder with brand colors
5. Add job descriptions to `job-descriptions/`

## 📝 Configuration

### Theme Mapping (`config/theme-mapping.json`)
Maps companies to their preferred themes and styling:
```json
{
  "jpmorgan-chase": {
    "theme": "finance",
    "colors": { "primary": "#dc382d" }
  }
}
```

### User Profiles (`config/user-profiles.json`)
Defines user preferences and default settings:
```json
{
  "tarun": {
    "defaultTheme": "tech",
    "targets": ["jpmorgan-chase", "microsoft"]
  }
}
```

## 🎨 Available Themes

- **Standard**: Professional, clean layout
- **Tech**: Technology-focused with modern styling  
- **Finance**: Traditional, formal appearance for financial services

## 📊 Data Structure

All user data follows the JSON Resume schema (v1.0.0) for consistency and compatibility.

## 🔧 Customization

- Add new themes in `resume-generator/themes/`
- Create company-specific templates in `resume-generator/templates/`
- Modify build behavior in `config/build-config.json`
- Add shared resources to `shared/` directories

## 📈 Benefits

✅ **Scalable**: Easy to add new users and companies  
✅ **Flexible**: Multiple themes and output formats  
✅ **Reusable**: Common generator for all users  
✅ **Organized**: Clear separation of concerns  
✅ **Maintainable**: Structured data and configuration  

## 🔄 Migration Status

- ✅ Directory structure created
- ✅ Configuration files added
- ✅ Tarun's data migrated to new structure
- ✅ Kriti's data migrated to new structure
- ✅ Company data organized
- ✅ Themes and templates created
- ✅ Enhanced build scripts added

The repository is now ready for professional, scalable resume management!
