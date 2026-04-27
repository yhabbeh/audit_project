/**
 * GoogleSheetsAdapter - Uses Google Sheets REST API v4 as the live database
 * Implements DataAdapter interface
 * 
 * Note: For production use, configure CORS via Google Apps Script web app wrapper
 * See SETUP.md for detailed configuration instructions
 */

class GoogleSheetsAdapter extends DataAdapter {
    constructor() {
        super();
        this.spreadsheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId;
        this.apiKey = GOOGLE_SHEETS_CONFIG.apiKey;
        this.baseUrl = GOOGLE_SHEETS_CONFIG.sheetsUrl;
    }

    /**
     * Get range string for a sheet
     */
    getRange(sheetName, range = '') {
        return `${sheetName}!${range}`;
    }

    /**
     * Fetch data from Google Sheets API
     */
    async fetchFromAPI(range) {
        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodeURIComponent(range)}?key=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Google Sheets API error: ${response.status}`);
            }
            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('Failed to fetch from Google Sheets:', error);
            throw error;
        }
    }

    /**
     * Write data to Google Sheets via Apps Script (for CORS handling)
     */
    async writeToAppsScript(action, sheetName, data) {
        if (!APP_SCRIPT_URL) {
            throw new Error('Apps Script URL not configured. See SETUP.md');
        }

        try {
            const response = await fetch(APP_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    sheet: sheetName,
                    data
                })
            });

            if (!response.ok) {
                throw new Error(`Apps Script error: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Failed to write via Apps Script:', error);
            throw error;
        }
    }

    /**
     * Convert sheet rows to objects based on header row
     */
    rowsToObjects(rows) {
        if (rows.length === 0) return [];
        
        const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
        const objects = [];

        for (let i = 1; i < rows.length; i++) {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = rows[i][index] || '';
            });
            
            // Ensure id field exists
            if (!obj.id && obj.record_id) {
                obj.id = obj.record_id;
            }
            
            objects.push(obj);
        }

        return objects;
    }

    /**
     * Get all records of an entity
     */
    async getAll(entity) {
        const sheetName = ENTITIES[entity.toUpperCase()] || entity;
        const range = this.getRange(sheetName, 'A:Z');
        const rows = await this.fetchFromAPI(range);
        return this.rowsToObjects(rows);
    }

    /**
     * Get a single record by ID
     */
    async getById(entity, id) {
        const records = await this.getAll(entity);
        return records.find(r => r.id === id || r.record_id === id) || null;
    }

    /**
     * Create a new record
     */
    async create(entity, data) {
        const sheetName = ENTITIES[entity.toUpperCase()] || entity;
        
        // Get headers first
        const records = await this.getAll(entity);
        const headers = records.length > 0 
            ? Object.keys(records[0])
            : Object.keys(data);

        // Create row data matching headers
        const rowData = headers.map(header => {
            if (header === 'id' || header === 'record_id') {
                return Date.now().toString();
            }
            if (header === 'created_at') {
                return new Date().toISOString();
            }
            return data[header] || data[header.replace('_id', '')] || '';
        });

        await this.writeToAppsScript('append_row', sheetName, [rowData]);
        
        // Return the created record with generated ID
        const newRecord = { ...data, id: Date.now().toString() };
        return newRecord;
    }

    /**
     * Update an existing record
     */
    async update(entity, id, data) {
        const sheetName = ENTITIES[entity.toUpperCase()] || entity;
        const records = await this.getAll(entity);
        const rowIndex = records.findIndex(r => r.id === id || r.record_id === id);

        if (rowIndex === -1) {
            throw new Error('Record not found');
        }

        // Get headers
        const headers = Object.keys(records[rowIndex]);
        
        // Create updated row data
        const rowData = headers.map(header => {
            if (header === 'updated_at') {
                return new Date().toISOString();
            }
            if (header === 'id' || header === 'record_id') {
                return id;
            }
            return data[header] !== undefined ? data[header] : records[rowIndex][header];
        });

        await this.writeToAppsScript('update_row', sheetName, {
            row: rowIndex + 2, // +2 because sheets are 1-indexed and we have header row
            data: [rowData]
        });

        return { ...records[rowIndex], ...data };
    }

    /**
     * Delete a record
     */
    async delete(entity, id) {
        const sheetName = ENTITIES[entity.toUpperCase()] || entity;
        const records = await this.getAll(entity);
        const rowIndex = records.findIndex(r => r.id === id || r.record_id === id);

        if (rowIndex === -1) {
            return false;
        }

        await this.writeToAppsScript('delete_row', sheetName, {
            row: rowIndex + 2 // +2 because sheets are 1-indexed and we have header row
        });

        return true;
    }

    /**
     * Query records with filters
     */
    async query(entity, filters) {
        const records = await this.getAll(entity);
        
        if (!filters || Object.keys(filters).length === 0) {
            return records;
        }

        return records.filter(record => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === '' || value === null || value === undefined) {
                    return true;
                }
                return record[key] === value || record[key.replace('_id', '')] === value;
            });
        });
    }

    /**
     * Check if adapter is connected
     */
    async isConnected() {
        try {
            if (!this.spreadsheetId || !this.apiKey) {
                return false;
            }
            // Try to fetch metadata
            const url = `${this.baseUrl}/${this.spreadsheetId}?key=${this.apiKey}`;
            const response = await fetch(url);
            return response.ok;
        } catch (e) {
            return false;
        }
    }
}

// Export for use in other modules
window.GoogleSheetsAdapter = GoogleSheetsAdapter;
