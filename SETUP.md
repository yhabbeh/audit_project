# Audit Committee Management System - Setup Guide

## Overview

This system uses a pluggable adapter pattern that supports two data sources:
1. **LocalStorage** (default) - Works offline, no setup required
2. **Google Sheets** - Live cloud database (requires configuration)

## Quick Start (LocalStorage Mode)

The system works out of the box with LocalStorage mode. No configuration needed!

### Test Credentials
- **Admin**: username: `admin`, password: `admin123`
- **Viewer**: username: `viewer`, password: `viewer123`

Simply open `index.html` in your browser and start using the system.

---

## Google Sheets Configuration

To use Google Sheets as the database backend, follow these steps:

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Name it something like "Audit Committee System"
4. Note the Project ID

### Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API" and enable it
3. Search for "Google Drive API" and enable it (for file management)

### Step 3: Create Credentials

#### Option A: API Key (Read-only access)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. Click "Edit API Key" and restrict it to:
   - HTTP referrers: Add your domain (or leave unrestricted for testing)
   - API restrictions: Select "Google Sheets API"

#### Option B: OAuth 2.0 (Full read/write access)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Add authorized JavaScript origins (your domain)
5. Download the JSON credentials file

### Step 4: Create Google Sheet

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Name it "Audit Committee Database"
3. Create the following tabs (exact names):

#### Meetings Tab
| Column | Header Name | Description |
|--------|-------------|-------------|
| A | id | Unique identifier (auto-generated) |
| B | meeting_number | Meeting number (e.g., 2024-001) |
| C | date | Meeting date (YYYY-MM-DD) |
| D | location | Meeting location |
| E | chairperson | Chairperson name |
| F | secretary | Secretary name |
| G | created_at | Creation timestamp |
| H | updated_at | Last update timestamp |

#### Members Tab
| Column | Header Name | Description |
|--------|-------------|-------------|
| A | id | Unique identifier |
| B | name | Member full name |
| C | role | Role/position |
| D | email | Email address |
| E | created_at | Creation timestamp |

#### Decisions Tab
| Column | Header Name | Description |
|--------|-------------|-------------|
| A | id | Unique identifier |
| B | decision_number | Decision number (e.g., DEC-2024-001) |
| C | decision_text | Full decision text |
| D | responsible_party | Responsible party |
| E | due_date | Due date (YYYY-MM-DD) |
| F | status | Status (pending/in_progress/implemented) |
| G | notes | Additional notes |
| H | meeting_id | Related meeting ID |
| I | created_at | Creation timestamp |

#### Agenda_Items Tab
| Column | Header Name | Description |
|--------|-------------|-------------|
| A | id | Unique identifier |
| B | meeting_id | Related meeting ID |
| C | subject | Agenda item subject |
| D | presenter | Presenter name |
| E | type | Type (informational/decision) |

#### Attendees Tab
| Column | Header Name | Description |
|--------|-------------|-------------|
| A | id | Unique identifier |
| B | meeting_id | Related meeting ID |
| C | member_id | Related member ID |
| D | status | Attendance status (present/absent/excused) |

#### Audit_Log Tab
| Column | Header Name | Description |
|--------|-------------|-------------|
| A | id | Unique identifier |
| B | timestamp | Action timestamp |
| C | user | Username who performed action |
| D | action | Action type (create/update/delete) |
| E | entity | Entity name |
| F | record_id | Affected record ID |
| G | old_value | Previous value (JSON) |
| H | new_value | New value (JSON) |

### Step 5: Get Spreadsheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the `SPREADSHEET_ID` part

### Step 6: Configure the Application

1. Open `js/config.js`
2. Update the following values:

```javascript
// Change adapter to google_sheets
const DB_ADAPTER = 'google_sheets';

// Add your credentials
const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',
    apiKey: 'YOUR_API_KEY_HERE',
    sheetsUrl: 'https://sheets.googleapis.com/v4/spreadsheets'
};
```

### Step 7: Set Up Google Apps Script (For Write Operations)

Google Sheets API has CORS restrictions. To handle write operations, deploy an Apps Script web app:

1. In your Google Sheet, go to Extensions > Apps Script
2. Delete any existing code and paste this:

```javascript
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(data.sheet);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Sheet not found'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var result;
  
  switch (data.action) {
    case 'append_row':
      sheet.appendRow(data.data[0]);
      result = {success: true};
      break;
      
    case 'update_row':
      var row = data.data.row;
      var rowData = data.data.data[0];
      for (var i = 0; i < rowData.length; i++) {
        sheet.getRange(row, i + 1).setValue(rowData[i]);
      }
      result = {success: true};
      break;
      
    case 'delete_row':
      sheet.deleteRow(data.data.row);
      result = {success: true};
      break;
      
    default:
      result = {error: 'Unknown action'};
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual spreadsheet ID
4. Click "Deploy" > "New deployment"
5. Select type: "Web app"
6. Description: "Audit Committee API"
7. Execute as: "Me"
8. Who has access: "Anyone" (or "Anyone with Google account" for more security)
9. Click "Deploy"
10. Copy the Web App URL

### Step 8: Update App Script URL in Config

1. Open `js/config.js`
2. Update the APP_SCRIPT_URL:

```javascript
const APP_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
```

### Step 9: Test the Connection

1. Open `index.html` in your browser
2. Login with admin credentials
3. Go to Settings page
4. Check "نوع قاعدة البيانات" shows "Google Sheets"
5. Check "حالة الاتصال" shows "متصل"

---

## Switching Between Adapters

To switch between LocalStorage and Google Sheets:

1. Open `js/config.js`
2. Change the `DB_ADAPTER` value:
   - `'local'` for LocalStorage (offline)
   - `'google_sheets'` for Google Sheets (online)

```javascript
const DB_ADAPTER = 'local'; // or 'google_sheets'
```

**Note**: Data does NOT sync between adapters. They are separate databases.

---

## Security Considerations

### For Production Use:

1. **Never expose API keys in client-side code** - Move API calls to a backend server
2. **Use OAuth 2.0** instead of API keys for better security
3. **Restrict API key** to specific domains and APIs
4. **Implement proper authentication** - The current hardcoded users are for demo only
5. **Enable audit logging** - All actions are logged to the Audit_Log sheet
6. **Regular backups** - Export your Google Sheet regularly

### Recommended Architecture for Production:

```
Browser → Your Backend Server → Google Sheets API
         (handles auth & API keys)
```

---

## Troubleshooting

### "Failed to load data" error
- Check browser console for specific errors
- Verify spreadsheet ID is correct
- Ensure API key is valid and has Sheets API enabled
- Check network tab for failed requests

### CORS errors
- Make sure Apps Script web app is deployed
- Verify APP_SCRIPT_URL is correct in config
- Ensure web app has "Anyone" access

### Permission denied
- Check that the Google account has edit access to the sheet
- Verify OAuth scopes include Sheets API

### Duplicate decision numbers
- The system checks for duplicates before saving
- If you manually edit the sheet, ensure numbers remain unique

---

## Migration to Other Databases

The adapter pattern makes it easy to switch databases:

1. Create a new adapter class (e.g., `PostgreSQLAdapter`)
2. Implement all DataAdapter methods
3. Change `DB_ADAPTER` in config
4. No UI code needs to change!

Example structure for a new adapter:

```javascript
class PostgreSQLAdapter extends DataAdapter {
    async getAll(entity) {
        // Your implementation
    }
    
    async getById(entity, id) {
        // Your implementation
    }
    
    // ... implement all other methods
}
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all configuration values
3. Test with LocalStorage first to isolate issues
4. Review Google Cloud Console for API quota limits
