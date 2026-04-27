/**
 * Main Application - Ties all modules together
 */

// Global database adapter instance
let db = null;

/**
 * Initialize the application
 */
async function initApp() {
    try {
        // Initialize data adapter based on config
        if (DB_ADAPTER === 'google_sheets') {
            db = new GoogleSheetsAdapter();
        } else {
            db = new LocalStorageAdapter();
        }

        // Check if user is already logged in
        const isLoggedIn = authManager.init();

        if (isLoggedIn) {
            showApp();
        } else {
            uiManager.showScreen('login-screen');
        }

        // Setup event listeners
        setupEventListeners();

        // Update settings display
        document.getElementById('db-type-display').textContent = 
            DB_ADAPTER === 'google_sheets' ? 'Google Sheets' : 'LocalStorage (Offline)';
        
        const connected = await db.isConnected();
        document.getElementById('connection-status').textContent = connected ? 'متصل' : 'غير متصل';
        document.getElementById('connection-status').style.color = connected ? 'var(--success-color)' : 'var(--danger-color)';

    } catch (error) {
        console.error('Failed to initialize app:', error);
        uiManager.showToast('فشل تهيئة التطبيق: ' + error.message, 'error');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = e.target.dataset.view;
            uiManager.showView(viewId);
            loadViewData(viewId);
        });
    });

    // Add buttons
    document.getElementById('add-meeting-btn').addEventListener('click', () => showAddModal('meeting'));
    document.getElementById('add-decision-btn').addEventListener('click', () => showAddModal('decision'));
    document.getElementById('add-member-btn').addEventListener('click', () => showAddModal('member'));

    // Modal close
    document.getElementById('modal-close').addEventListener('click', uiManager.hideModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') {
            uiManager.hideModal();
        }
    });

    // AI Panel
    document.getElementById('ai-float-btn').addEventListener('click', uiManager.showAIPanel);
    document.getElementById('close-ai-panel').addEventListener('click', uiManager.hideAIPanel);
    document.getElementById('ai-improve-btn').addEventListener('click', handleAIImprove);

    // Settings
    document.getElementById('save-api-key').addEventListener('click', saveAPIKey);

    // Dashboard filters
    document.getElementById('dashboard-search').addEventListener('input', filterDashboard);
    document.getElementById('filter-status').addEventListener('change', filterDashboard);
    document.getElementById('filter-party').addEventListener('change', filterDashboard);
    document.getElementById('filter-date-from').addEventListener('change', filterDashboard);
    document.getElementById('filter-date-to').addEventListener('change', filterDashboard);

    // Table actions (delegated events)
    document.querySelector('#decisions-table tbody').addEventListener('click', handleDecisionsTableClick);
    document.querySelector('#meetings-table tbody').addEventListener('click', handleMeetingsTableClick);
    document.querySelector('#members-table tbody').addEventListener('click', handleMembersTableClick);
    document.querySelector('#all-decisions-table tbody').addEventListener('click', handleAllDecisionsTableClick);

    // Form submission (delegated for dynamically created forms)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'entity-form') {
            const modalTitle = document.getElementById('modal-title').textContent;
            let type = '';
            if (modalTitle.includes('اجتماع')) type = 'meeting';
            else if (modalTitle.includes('قرار')) type = 'decision';
            else if (modalTitle.includes('عضو')) type = 'member';
            
            if (type) {
                handleFormSubmit(e, type);
            }
        }
    });
}

/**
 * Handle login
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        await authManager.login(username, password, role);
        uiManager.showToast('تم تسجيل الدخول بنجاح', 'success');
        showApp();
    } catch (error) {
        document.getElementById('login-error').textContent = error.message;
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    authManager.logout();
    uiManager.showScreen('login-screen');
    document.getElementById('login-form').reset();
    document.getElementById('login-error').textContent = '';
}

/**
 * Show main application screen
 */
function showApp() {
    uiManager.showScreen('app-screen');
    uiManager.updateUserInfo(authManager.getUser());
    uiManager.updateUIForRole(authManager.isAdmin());
    loadViewData('dashboard');
}

/**
 * Load data for specific view
 */
async function loadViewData(viewId) {
    switch (viewId) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'meetings':
            await loadMeetings();
            break;
        case 'decisions':
            await loadAllDecisions();
            break;
        case 'members':
            await loadMembers();
            break;
        case 'settings':
            // Load API key if exists
            const apiKey = localStorage.getItem('claude_api_key');
            if (apiKey) {
                document.getElementById('claude-api-key').value = apiKey;
            }
            break;
    }
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
    try {
        const decisions = await db.getAll('decisions');
        uiManager.updateKPIs(decisions);
        uiManager.populateFilterDropdowns(decisions);
        uiManager.renderDecisionsTable(decisions.slice(0, 10)); // Show first 10
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        uiManager.showToast('فشل تحميل البيانات', 'error');
    }
}

/**
 * Filter dashboard table
 */
async function filterDashboard() {
    const search = document.getElementById('dashboard-search').value.toLowerCase();
    const status = document.getElementById('filter-status').value;
    const party = document.getElementById('filter-party').value;
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;

    let decisions = await db.getAll('decisions');

    // Apply filters
    if (search) {
        decisions = decisions.filter(d => 
            d.decision_text?.toLowerCase().includes(search) ||
            d.decision_number?.toLowerCase().includes(search)
        );
    }

    if (status) {
        decisions = decisions.filter(d => d.status === status);
    }

    if (party) {
        decisions = decisions.filter(d => d.responsible_party === party);
    }

    if (dateFrom) {
        decisions = decisions.filter(d => d.due_date >= dateFrom);
    }

    if (dateTo) {
        decisions = decisions.filter(d => d.due_date <= dateTo);
    }

    uiManager.renderDecisionsTable(decisions);
}

/**
 * Load meetings
 */
async function loadMeetings() {
    try {
        const meetings = await db.getAll('meetings');
        uiManager.renderMeetingsTable(meetings);
    } catch (error) {
        console.error('Failed to load meetings:', error);
        uiManager.showToast('فشل تحميل الاجتماعات', 'error');
    }
}

/**
 * Load all decisions
 */
async function loadAllDecisions() {
    try {
        const decisions = await db.getAll('decisions');
        uiManager.renderDecisionsTable(decisions, 'all-decisions-table');
    } catch (error) {
        console.error('Failed to load decisions:', error);
        uiManager.showToast('فشل تحميل القرارات', 'error');
    }
}

/**
 * Load members
 */
async function loadMembers() {
    try {
        const members = await db.getAll('members');
        uiManager.renderMembersTable(members);
    } catch (error) {
        console.error('Failed to load members:', error);
        uiManager.showToast('فشل تحميل الأعضاء', 'error');
    }
}

/**
 * Show add modal
 */
function showAddModal(type) {
    if (!authManager.isAdmin()) {
        uiManager.showToast('ليس لديك صلاحية الإضافة', 'error');
        return;
    }

    const titles = {
        meeting: 'إضافة اجتماع جديد',
        decision: 'إضافة قرار جديد',
        member: 'إضافة عضو جديد'
    };

    uiManager.showModal(titles[type], uiManager.getFormHTML(type));

    // Generate decision number if adding decision
    if (type === 'decision') {
        generateDecisionNumber();
    }
}

/**
 * Show edit modal
 */
async function showEditModal(type, id) {
    if (!authManager.isAdmin()) {
        uiManager.showToast('ليس لديك صلاحية التعديل', 'error');
        return;
    }

    const titles = {
        meeting: 'تعديل اجتماع',
        decision: 'تعديل قرار',
        member: 'تعديل عضو'
    };

    try {
        const data = await db.getById(type, id);
        uiManager.showModal(titles[type], uiManager.getFormHTML(type, data));
    } catch (error) {
        uiManager.showToast('فشل تحميل البيانات', 'error');
    }
}

/**
 * Generate unique decision number
 */
async function generateDecisionNumber() {
    try {
        const decisions = await db.getAll('decisions');
        const year = new Date().getFullYear();
        let nextNum = 1;

        const yearDecisions = decisions.filter(d => d.decision_number?.includes(year.toString()));
        if (yearDecisions.length > 0) {
            const maxNum = Math.max(...yearDecisions.map(d => {
                const match = d.decision_number.match(/DEC-\d+-(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }));
            nextNum = maxNum + 1;
        }

        const decisionNumber = `DEC-${year}-${String(nextNum).padStart(3, '0')}`;
        const input = document.getElementById('decision_number');
        if (input) {
            input.value = decisionNumber;
        }
    } catch (error) {
        console.error('Failed to generate decision number:', error);
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e, type) {
    e.preventDefault();

    if (!authManager.isAdmin()) {
        uiManager.showToast('ليس لديك صلاحية الحفظ', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const id = data.id;

    try {
        // Validate decision number uniqueness for new decisions
        if (type === 'decision' && !id) {
            const decisions = await db.getAll('decisions');
            const exists = decisions.some(d => d.decision_number === data.decision_number);
            if (exists) {
                uiManager.showToast('رقم القرار مكرر، يرجى استخدام رقم آخر', 'error');
                return;
            }
        }

        // Validate meeting number uniqueness for new meetings
        if (type === 'meeting' && !id) {
            const meetings = await db.getAll('meetings');
            const exists = meetings.some(m => m.meeting_number === data.meeting_number);
            if (exists) {
                uiManager.showToast('رقم الاجتماع مكرر، يرجى استخدام رقم آخر', 'error');
                return;
            }
        }

        if (id) {
            // Update existing
            const oldData = await db.getById(type, id);
            await db.update(type, id, data);
            await db.logAudit(
                authManager.getUser().username,
                'update',
                type,
                id,
                oldData,
                data
            );
            uiManager.showToast('تم التعديل بنجاح', 'success');
        } else {
            // Create new
            const newRecord = await db.create(type, data);
            await db.logAudit(
                authManager.getUser().username,
                'create',
                type,
                newRecord.id,
                null,
                data
            );
            uiManager.showToast('تمت الإضافة بنجاح', 'success');
        }

        uiManager.hideModal();
        loadViewData(uiManager.currentView);

    } catch (error) {
        console.error('Failed to save:', error);
        uiManager.showToast('فشل الحفظ: ' + error.message, 'error');
    }
}

/**
 * Handle delete
 */
async function handleDelete(type, id) {
    if (!authManager.isAdmin()) {
        uiManager.showToast('ليس لديك صلاحية الحذف', 'error');
        return;
    }

    if (!confirm('هل أنت متأكد من الحذف؟')) {
        return;
    }

    try {
        const oldData = await db.getById(type, id);
        await db.delete(type, id);
        await db.logAudit(
            authManager.getUser().username,
            'delete',
            type,
            id,
            oldData,
            null
        );
        uiManager.showToast('تم الحذف بنجاح', 'success');
        loadViewData(uiManager.currentView);
    } catch (error) {
        uiManager.showToast('فشل الحذف: ' + error.message, 'error');
    }
}

/**
 * Handle decisions table clicks
 */
function handleDecisionsTableClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains('edit-decision')) {
        showEditModal('decision', id);
    } else if (target.classList.contains('delete-decision')) {
        handleDelete('decision', id);
    } else if (target.classList.contains('view-decision')) {
        viewDecision(id);
    }
}

/**
 * Handle all decisions table clicks
 */
function handleAllDecisionsTableClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains('edit-decision')) {
        showEditModal('decision', id);
    } else if (target.classList.contains('delete-decision')) {
        handleDelete('decision', id);
    } else if (target.classList.contains('view-decision')) {
        viewDecision(id);
    }
}

/**
 * View decision details
 */
async function viewDecision(id) {
    try {
        const decision = await db.getById('decision', id);
        const content = `
            <div class="view-detail">
                <p><strong>رقم القرار:</strong> ${decision.decision_number || ''}</p>
                <p><strong>النص:</strong> ${decision.decision_text || ''}</p>
                <p><strong>المسؤول:</strong> ${decision.responsible_party || ''}</p>
                <p><strong>تاريخ الاستحقاق:</strong> ${formatDateArabic(decision.due_date)}</p>
                <p><strong>الحالة:</strong> ${getStatusLabel(decision.status)}</p>
                <p><strong>ملاحظات:</strong> ${decision.notes || ''}</p>
            </div>
        `;
        uiManager.showModal('تفاصيل القرار', content);
    } catch (error) {
        uiManager.showToast('فشل تحميل التفاصيل', 'error');
    }
}

/**
 * Handle meetings table clicks
 */
function handleMeetingsTableClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains('edit-meeting')) {
        showEditModal('meeting', id);
    } else if (target.classList.contains('delete-meeting')) {
        handleDelete('meeting', id);
    } else if (target.classList.contains('view-meeting')) {
        viewMeeting(id);
    } else if (target.classList.contains('generate-minutes')) {
        generateMinutes(id);
    }
}

/**
 * View meeting details
 */
async function viewMeeting(id) {
    try {
        const meeting = await db.getById('meeting', id);
        const content = `
            <div class="view-detail">
                <p><strong>رقم الاجتماع:</strong> ${meeting.meeting_number || ''}</p>
                <p><strong>التاريخ:</strong> ${formatDateArabic(meeting.date)}</p>
                <p><strong>المكان:</strong> ${meeting.location || ''}</p>
                <p><strong>الرئيس:</strong> ${meeting.chairperson || ''}</p>
                <p><strong>السكرتير:</strong> ${meeting.secretary || ''}</p>
            </div>
        `;
        uiManager.showModal('تفاصيل الاجتماع', content);
    } catch (error) {
        uiManager.showToast('فشل تحميل التفاصيل', 'error');
    }
}

/**
 * Generate meeting minutes
 */
async function generateMinutes(meetingId) {
    try {
        const meeting = await db.getById('meeting', meetingId);
        const attendees = await db.query('attendees', { meeting_id: meetingId });
        const agendaItems = await db.query('agenda_items', { meeting_id: meetingId });
        
        // Get decisions for this meeting (we'd need meeting_id in decisions for full implementation)
        const decisions = await db.getAll('decisions');
        
        await wordGenerator.generateMeetingMinutes(meeting, attendees, agendaItems, decisions);
        uiManager.showToast('تم توليد المحضر بنجاح', 'success');
    } catch (error) {
        console.error('Failed to generate minutes:', error);
        uiManager.showToast('فشل توليد المحضر: ' + error.message, 'error');
    }
}

/**
 * Handle members table clicks
 */
function handleMembersTableClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains('edit-member')) {
        showEditModal('member', id);
    } else if (target.classList.contains('delete-member')) {
        handleDelete('member', id);
    }
}

/**
 * Handle AI improve
 */
async function handleAIImprove() {
    const text = document.getElementById('ai-input-text').value;
    const resultDiv = document.getElementById('ai-result');

    if (!text.trim()) {
        resultDiv.innerHTML = '<span class="error-message">الرجاء إدخال نص</span>';
        return;
    }

    resultDiv.innerHTML = '<span class="loading">جاري المعالجة...</span>';

    try {
        const decisions = await db.getAll('decisions');
        const result = await aiHelper.improveAndCheck(text, decisions);

        let html = `<div><strong>النص المحسن:</strong><br>${result.improved}</div>`;
        
        if (result.duplicateWarning) {
            html += `<div style="margin-top: 10px; color: var(--warning-color);"><strong>تحذير:</strong> ${result.duplicateWarning}</div>`;
        }

        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.innerHTML = `<span class="error-message">${error.message}</span>`;
    }
}

/**
 * Save API key
 */
function saveAPIKey() {
    const key = document.getElementById('claude-api-key').value;
    aiHelper.setApiKey(key);
    uiManager.showToast('تم حفظ المفتاح بنجاح', 'success');
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
