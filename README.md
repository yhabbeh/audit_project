# Audit Committee Management System

نظام إدارة لجنة التدقيق - Audit Committee Management System

A complete, production-ready single-page web application for managing audit committee operations.

## Features

- **Authentication**: Role-based access (Admin/Viewer)
- **Dashboard**: KPI cards with live statistics, color-coded decisions table
- **Meetings Management**: Full CRUD operations for meetings
- **Decisions Management**: Track decisions with status, due dates, and responsible parties
- **Members Management**: Manage committee members
- **Word Report Generator**: Generate meeting minutes as .docx files
- **AI Integration**: Claude API integration for text improvement and duplicate detection
- **RTL Support**: Full Arabic right-to-left interface
- **Offline Mode**: Works with LocalStorage when Google Sheets is not configured

## Quick Start

1. Open `index.html` in your browser
2. Login with test credentials:
   - **Admin**: username: `admin`, password: `admin123`
   - **Viewer**: username: `viewer`, password: `viewer123`

## File Structure

```
audit_project/
├── index.html          # Main HTML file
├── SETUP.md            # Detailed setup instructions
├── README.md           # This file
├── css/
│   └── styles.css      # All CSS styles
└── js/
    ├── config.js       # Configuration and constants
    ├── data-adapter.js # Abstract DataAdapter interface
    ├── local-storage-adapter.js  # LocalStorage implementation
    ├── google-sheets-adapter.js  # Google Sheets implementation
    ├── auth.js         # Authentication module
    ├── ui.js           # UI rendering and interactions
    ├── word-generator.js # Word document generation
    ├── ai-helper.js    # Claude AI integration
    └── app.js          # Main application logic
```

## Architecture

The system uses the **Adapter Pattern** for pluggable data sources:

- Switch between LocalStorage and Google Sheets via `DB_ADAPTER` config
- UI code never calls data APIs directly
- Easy to add new adapters (PostgreSQL, MongoDB, etc.)

## Configuration

Edit `js/config.js`:

```javascript
// Choose data source: 'local' or 'google_sheets'
const DB_ADAPTER = 'local';
```

See `SETUP.md` for detailed Google Sheets configuration.

## Technologies

- HTML5, CSS3, Vanilla JavaScript (no frameworks)
- Google Sheets API v4
- docx.js for Word document generation
- Claude/Anthropic API for AI features

## License

MIT License
