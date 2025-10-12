# CV Repository

This repository contains professional resumes and CVs for multiple individuals in various formats optimized for different use cases.

## Members

### Tarun Telang
Located in `tarun/` folder:
- **Resume Generator System** (`tarun/resume-generator/`)
  - **`resume-generator.js`** - Dynamic resume generator class with themed CSS
  - **`build-resume.js`** - Build script for generating static HTML resumes
  - **`resume-dynamic.html`** - Interactive resume viewer with theme switching
  - **`README.md`** - Detailed generator documentation

- **JSON Resume Data** (Primary Source)
  - **`resume.json`** - Main resume in JSON Resume schema format
  - **`resume-jpmc-director.json`** - JPMorgan Chase Director position specific resume
  - Follows [JSON Resume Schema v1.0.0](https://jsonresume.org/schema/)
  - Single source of truth preventing content duplication

- **Generated HTML Resumes**
  - **`resume.html`** - Standard HTML resume format
  - **`resume-jpmc-director.html`** - JPMorgan Chase Director themed resume
  - **`resume-oreilly.html`** - O'Reilly-themed HTML resume for technical roles
  - **`resume-solutions-engineer.html`** - Solutions Engineer focused resume
  - **`resume-zeals.html`** - Company-specific resume format

- **Other Formats**
  - **`Resume.md`** - Markdown format for easy editing and version control
  - **`LInkedIn_Profile.pdf`** - LinkedIn profile reference document

### Build Scripts
```bash
npm run build:standard    # Generate standard themed resume in tarun/
npm run build:jpmc       # Generate JPMorgan Chase themed resume in tarun/
npm run build:oreilly    # Generate O'Reilly themed resume in tarun/
```

### Kriti Telang
Located in `kriti/` folder:
- **`Resume-Kriti-Telang-LBG.html`** - HTML resume for Lloyd's Banking Group role
- **`Resume-Kriti-Telang.pdf`** - PDF version
- **`images/`** - Certification badges and logos
  - Oracle certification
  - PMI-ACP (Agile Certified Practitioner)
  - PSM (Professional Scrum Master)
  - Toastmaster International

### Tarun Telang
Located in `tarun/` folder:
- **`resume-solutions-engineer.html`** - Solutions Engineer focused resume
- **`resume-zeals.html`** - Company-specific resume format

## 🚀 Using the Resume Generator

### Dynamic Resume Viewer
Open `tarun/resume-generator/resume-dynamic.html` in your browser for an interactive resume viewer with:
- Real-time theme switching (Standard, JPMorgan Chase, O'Reilly)
- Print-optimized CSS
- Responsive design for all screen sizes
- Direct JSON loading and rendering

### Building Static Resumes
```bash
npm run build:standard    # Generates tarun/resume-standard-generated.html
npm run build:jpmc       # Generates tarun/resume-jpmc-generated.html  
npm run build:oreilly    # Generates tarun/resume-oreilly-generated.html
```

### Local Development Server
```bash
cd /workspaces/cv
python3 -m http.server 8000
# Then visit http://localhost:8000/tarun/resume-generator/resume-dynamic.html
```

### JSON Resume CLI (Alternative)
```bash
# Install JSON Resume CLI
npm install -g resume-cli

# Serve locally with a theme
resume serve --theme elegant

# Export to PDF
resume export resume.pdf --theme elegant
```

### Available Themes
Popular themes that work well with this resume:
- `elegant` - Clean, professional layout
- `kendall` - Modern, minimalist design
- `stackoverflow` - Developer-focused theme
- `macchiato` - Colorful, creative layout
- `jsonresume-theme-paper` - Print-optimized theme

## 📋 Resume Highlights

**Tarun Telang** - Engineering Leader & AI Expert
- 20+ years in enterprise software development
- Chief Technology Officer at Lets Practice Academy
- Former Senior Manager at Highspot, Microsoft, Oracle, OYO
- Published author (7 technical books with Apress & O'Reilly)
- Expert in C#/.NET, Java/Spring, AI/ML, Cloud Architecture

### Key Technical Achievements
- Built enterprise REST APIs handling 10M+ requests/day
- Developed AI-driven meeting intelligence systems
- Architected microservices reducing response time by 45%
- Led teams of 30+ engineers across multiple companies
- Designed and implemented Web3 solutions and smart contracts

### Publications
- **Practical Microservices Architectural Patterns** (Apress, 2025)
- **Learn Microservices with Spring Boot 3** (Apress, 2023)
- **Jakarta EE Fundamentals** (O'Reilly, 2022)
- **Java 17 Fundamentals** (O'Reilly, 2022)
- And more...

## 🛠️ Technical Skills

- **Languages**: C#/.NET, Java/Spring, SQL Server, Solidity
- **AI/ML**: Agentic Systems, NLP, Intelligent Automation
- **Web3/Blockchain**: Smart Contracts, DeFi Protocols, Ethereum, Web3.js, dApps
- **Cloud**: AWS, Azure, Cloud-Native Solutions
- **Architecture**: Microservices, Enterprise Systems, REST APIs
- **Leadership**: Team Building, Technical Vision, Agile Transformation

## 📞 Contact

- **Email**: tarun.telang@gmail.com
- **LinkedIn**: [linkedin.com/in/taruntelang](https://linkedin.com/in/taruntelang)
- **Website**: [practicaldeveloper.com](https://practicaldeveloper.com)

## 📄 License

This repository contains personal resume information. Please respect privacy and use responsibly.