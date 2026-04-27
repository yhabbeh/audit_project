/**
 * LocalStorageAdapter - Fallback/offline mode using browser localStorage
 * Implements DataAdapter interface
 */

class LocalStorageAdapter extends DataAdapter {
    constructor() {
        super();
        this.storagePrefix = 'audit_app_';
        this.initializeStorage();
    }

    /**
     * Initialize storage with sample data if empty
     */
    initializeStorage() {
        Object.keys(SAMPLE_DATA).forEach(entity => {
            const key = this.storagePrefix + entity;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(SAMPLE_DATA[entity]));
            }
        });
        
        // Initialize audit log
        const auditKey = this.storagePrefix + 'audit_log';
        if (!localStorage.getItem(auditKey)) {
            localStorage.setItem(auditKey, JSON.stringify([]));
        }
    }

    /**
     * Get storage key for entity
     */
    getStorageKey(entity) {
        return this.storagePrefix + entity.toLowerCase();
    }

    /**
     * Get all records of an entity
     */
    async getAll(entity) {
        const key = this.getStorageKey(entity);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Get a single record by ID
     */
    async getById(entity, id) {
        const records = await this.getAll(entity);
        return records.find(r => r.id === id) || null;
    }

    /**
     * Create a new record
     */
    async create(entity, data) {
        const records = await this.getAll(entity);
        const newRecord = {
            ...data,
            id: Date.now().toString(),
            created_at: new Date().toISOString()
        };
        records.push(newRecord);
        localStorage.setItem(this.getStorageKey(entity), JSON.stringify(records));
        return newRecord;
    }

    /**
     * Update an existing record
     */
    async update(entity, id, data) {
        const records = await this.getAll(entity);
        const index = records.findIndex(r => r.id === id);
        
        if (index === -1) {
            throw new Error('Record not found');
        }

        const oldRecord = { ...records[index] };
        records[index] = {
            ...records[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        localStorage.setItem(this.getStorageKey(entity), JSON.stringify(records));
        return records[index];
    }

    /**
     * Delete a record
     */
    async delete(entity, id) {
        const records = await this.getAll(entity);
        const filtered = records.filter(r => r.id !== id);
        
        if (filtered.length === records.length) {
            return false;
        }

        localStorage.setItem(this.getStorageKey(entity), JSON.stringify(filtered));
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
                return record[key] === value;
            });
        });
    }

    /**
     * Override logAudit for localStorage
     */
    async logAudit(user, action, entity, recordId, oldValue, newValue) {
        const auditKey = this.storagePrefix + 'audit_log';
        const audits = JSON.parse(localStorage.getItem(auditKey) || '[]');
        
        const auditEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            user,
            action,
            entity,
            record_id: recordId,
            old_value: oldValue ? JSON.stringify(oldValue) : '',
            new_value: newValue ? JSON.stringify(newValue) : ''
        };

        audits.push(auditEntry);
        localStorage.setItem(auditKey, JSON.stringify(audits));
        return auditEntry;
    }

    /**
     * Check if adapter is available
     */
    async isConnected() {
        try {
            localStorage.setItem('_test_', 'test');
            localStorage.removeItem('_test_');
            return true;
        } catch (e) {
            return false;
        }
    }
}

// Export for use in other modules
window.LocalStorageAdapter = LocalStorageAdapter;
