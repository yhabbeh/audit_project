/**
 * Authentication Module
 * Handles user login, logout, and session management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'audit_app_session';
    }

    /**
     * Initialize auth state from sessionStorage
     */
    init() {
        const sessionData = sessionStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                this.currentUser = JSON.parse(sessionData);
            } catch (e) {
                this.logout();
            }
        }
        return this.currentUser !== null;
    }

    /**
     * Login with username and password
     * For demo, uses hardcoded test users
     */
    async login(username, password, role) {
        // Find user in test users
        const user = TEST_USERS.find(u => 
            u.username === username && 
            u.password === password
        );

        if (!user) {
            throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }

        // Verify role matches
        if (user.role !== role) {
            throw new Error('الدور المحدد لا يتطابق مع بيانات المستخدم');
        }

        // Check permissions
        const roleConfig = ROLES[user.role];
        if (!roleConfig) {
            throw new Error('الدور غير صالح');
        }

        // Create session
        this.currentUser = {
            username: user.username,
            role: user.role,
            roleName: roleConfig.name,
            permissions: roleConfig.permissions,
            loginTime: new Date().toISOString()
        };

        // Store in sessionStorage (clears on tab close)
        sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));

        return this.currentUser;
    }

    /**
     * Logout and clear session
     */
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem(this.sessionKey);
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        return this.currentUser.permissions.includes(permission);
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.hasPermission('delete'); // Admin has all permissions including delete
    }

    /**
     * Check if user is viewer (read-only)
     */
    isViewer() {
        return this.currentUser && !this.isAdmin();
    }
}

// Create global instance
window.authManager = new AuthManager();
