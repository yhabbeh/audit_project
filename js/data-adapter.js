/**
 * DataAdapter Interface - Abstract base class for data operations
 * Implements the Adapter Pattern for pluggable data sources
 */

class DataAdapter {
    /**
     * Get all records of an entity
     * @param {string} entity - Entity name
     * @returns {Promise<Array>} Array of records
     */
    async getAll(entity) {
        throw new Error('Method getAll() must be implemented');
    }

    /**
     * Get a single record by ID
     * @param {string} entity - Entity name
     * @param {string} id - Record ID
     * @returns {Promise<Object>} Single record
     */
    async getById(entity, id) {
        throw new Error('Method getById() must be implemented');
    }

    /**
     * Create a new record
     * @param {string} entity - Entity name
     * @param {Object} data - Record data
     * @returns {Promise<Object>} Created record with ID
     */
    async create(entity, data) {
        throw new Error('Method create() must be implemented');
    }

    /**
     * Update an existing record
     * @param {string} entity - Entity name
     * @param {string} id - Record ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} Updated record
     */
    async update(entity, id, data) {
        throw new Error('Method update() must be implemented');
    }

    /**
     * Delete a record
     * @param {string} entity - Entity name
     * @param {string} id - Record ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(entity, id) {
        throw new Error('Method delete() must be implemented');
    }

    /**
     * Query records with filters
     * @param {string} entity - Entity name
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Filtered records
     */
    async query(entity, filters) {
        throw new Error('Method query() must be implemented');
    }

    /**
     * Log an audit entry
     * @param {string} user - Username
     * @param {string} action - Action type (create/update/delete)
     * @param {string} entity - Entity name
     * @param {string} recordId - Record ID
     * @param {Object} oldValue - Previous value
     * @param {Object} newValue - New value
     */
    async logAudit(user, action, entity, recordId, oldValue, newValue) {
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
        
        try {
            await this.create(ENTITIES.AUDIT_LOG, auditEntry);
        } catch (e) {
            console.warn('Failed to log audit entry:', e);
        }
    }
}

// Export for use in other modules
window.DataAdapter = DataAdapter;
