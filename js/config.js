// Configuration file for the Audit Committee Management System

// Database Adapter Selection: 'google_sheets' or 'local'
const DB_ADAPTER = 'local';

// User Roles (hardcoded, not stored in Sheets)
const ROLES = {
    viewer: {
        name: 'مطلع',
        permissions: ['read']
    },
    admin: {
        name: 'مدير',
        permissions: ['read', 'create', 'update', 'delete']
    }
};

// Hardcoded test users for demo purposes
const TEST_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'viewer', password: 'viewer123', role: 'viewer' }
];

// Google Sheets Configuration (to be filled during setup)
const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: '', // Your Google Sheets ID
    apiKey: '', // Your API key
    sheetsUrl: 'https://sheets.googleapis.com/v4/spreadsheets'
};

// Entity Names (Sheet Tab Names)
const ENTITIES = {
    MEETINGS: 'Meetings',
    ATTENDEES: 'Attendees',
    AGENDA_ITEMS: 'Agenda_Items',
    DECISIONS: 'Decisions',
    MEMBERS: 'Members',
    AUDIT_LOG: 'Audit_Log'
};

// Decision Status Options
const DECISION_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    IMPLEMENTED: 'implemented'
};

// Attendance Status Options
const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    EXCUSED: 'excused'
};

// Agenda Item Types
const AGENDA_TYPES = {
    INFORMATIONAL: 'informational',
    DECISION: 'decision'
};

// App Script URL for CORS handling (to be configured)
const APP_SCRIPT_URL = '';

// Default sample data for local storage initialization
const SAMPLE_DATA = {
    members: [
        { id: '1', name: 'أحمد محمد علي', role: 'رئيس اللجنة', email: 'ahmed@company.com' },
        { id: '2', name: 'فاطمة حسن أحمد', role: 'عضو', email: 'fatima@company.com' },
        { id: '3', name: 'محمد سعيد عمر', role: 'عضو', email: 'mohammed@company.com' },
        { id: '4', name: 'سارة خالد يوسف', role: 'سكرتير', email: 'sara@company.com' }
    ],
    meetings: [
        { id: '1', meeting_number: '2024-001', date: '2024-01-15', location: 'قاعة الاجتماعات الرئيسية', chairperson: 'أحمد محمد علي', secretary: 'سارة خالد يوسف' },
        { id: '2', meeting_number: '2024-002', date: '2024-02-20', location: 'قاعة الاجتماعات الثانوية', chairperson: 'أحمد محمد علي', secretary: 'سارة خالد يوسف' }
    ],
    decisions: [
        { id: '1', decision_number: 'DEC-2024-001', decision_text: 'اعتماد الميزانية السنوية للشركة', responsible_party: 'الإدارة المالية', due_date: '2024-03-01', status: 'implemented', notes: 'تم التنفيذ بنجاح', meeting_id: '1' },
        { id: '2', decision_number: 'DEC-2024-002', decision_text: 'تحديث نظام إدارة المخاطر', responsible_party: 'إدارة تقنية المعلومات', due_date: '2024-06-01', status: 'in_progress', notes: 'جاري العمل على المشروع', meeting_id: '1' },
        { id: '3', decision_number: 'DEC-2024-003', decision_text: 'مراجعة سياسة الموارد البشرية', responsible_party: 'إدارة الموارد البشرية', due_date: '2024-01-30', status: 'pending', notes: 'في انتظار المراجعة النهائية', meeting_id: '2' }
    ],
    agenda_items: [
        { id: '1', meeting_id: '1', subject: 'مراجعة الأداء المالي', presenter: 'مدير المالية', type: 'decision' },
        { id: '2', meeting_id: '1', subject: 'تحديث أنظمة الأمن السيبراني', presenter: 'مدير تقنية المعلومات', type: 'informational' },
        { id: '3', meeting_id: '2', subject: 'سياسة التوظيف الجديدة', presenter: 'مدير الموارد البشرية', type: 'decision' }
    ],
    attendees: [
        { id: '1', meeting_id: '1', member_id: '1', status: 'present' },
        { id: '2', meeting_id: '1', member_id: '2', status: 'present' },
        { id: '3', meeting_id: '1', member_id: '3', status: 'excused' },
        { id: '4', meeting_id: '1', member_id: '4', status: 'present' }
    ]
};

// Helper function to format dates in Arabic locale
function formatDateArabic(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Helper function to get status label in Arabic
function getStatusLabel(status) {
    const labels = {
        'pending': 'معلقة',
        'in_progress': 'قيد التنفيذ',
        'implemented': 'منفذة'
    };
    return labels[status] || status;
}

// Helper function to get attendance label in Arabic
function getAttendanceLabel(status) {
    const labels = {
        'present': 'حاضر',
        'absent': 'غائب',
        'excused': 'معتذر'
    };
    return labels[status] || status;
}
