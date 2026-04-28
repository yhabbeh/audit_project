/**
 * UI Manager - Handles all UI interactions and rendering
 */

class UIManager {
    constructor() {
        this.currentView = 'dashboard';
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Switch between screens
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    /**
     * Switch between views
     */
    showView(viewId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(viewId + '-view').classList.add('active');

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewId) {
                btn.classList.add('active');
            }
        });

        this.currentView = viewId;
    }

    /**
     * Show/hide modal
     */
    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    /**
     * Show/hide AI panel
     */
    showAIPanel() {
        document.getElementById('ai-panel').classList.remove('hidden');
    }

    hideAIPanel() {
        document.getElementById('ai-panel').classList.add('hidden');
    }

    /**
     * Toggle button visibility based on permissions
     */
    updateUIForRole(isAdmin) {
        const writeButtons = document.querySelectorAll('.write-action');
        writeButtons.forEach(btn => {
            btn.style.display = isAdmin ? 'inline-flex' : 'none';
        });

        // Update add buttons
        const addButtons = ['add-meeting-btn', 'add-decision-btn', 'add-member-btn'];
        addButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = isAdmin ? 'block' : 'none';
            }
        });
    }

    /**
     * Update user info display
     */
    updateUserInfo(user) {
        const userInfo = document.getElementById('user-info');
        if (user) {
            userInfo.textContent = `${user.roleName}: ${user.username}`;
        }
    }

    /**
     * Render decisions table
     */
    renderDecisionsTable(decisions, containerId = 'decisions-table') {
        const tbody = document.querySelector(`#${containerId} tbody`);
        if (!tbody) return;

        tbody.innerHTML = '';

        if (decisions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد قرارات</td></tr>';
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        decisions.forEach(decision => {
            const dueDate = decision.due_date ? new Date(decision.due_date) : null;
            let statusClass = `status-${decision.status}`;
            
            // Check for overdue
            if (dueDate && dueDate < today && decision.status !== 'implemented') {
                statusClass = 'status-overdue';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${decision.decision_number || ''}</td>
                <td>${decision.decision_text || ''}</td>
                <td>${decision.responsible_party || ''}</td>
                <td>${formatDateArabic(decision.due_date)}</td>
                <td class="${statusClass}">${getStatusLabel(decision.status)}</td>
                <td>
                    <button class="btn btn-small btn-secondary view-decision" data-id="${decision.id}">عرض</button>
                    ${authManager.isAdmin() ? `
                        <button class="btn btn-small btn-primary edit-decision write-action" data-id="${decision.id}">تعديل</button>
                        <button class="btn btn-small btn-danger delete-decision write-action" data-id="${decision.id}">حذف</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * Render meetings table
     */
    renderMeetingsTable(meetings) {
        const tbody = document.querySelector('#meetings-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Sort by date descending
        const sorted = [...meetings].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        if (sorted.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد اجتماعات</td></tr>';
            return;
        }

        sorted.forEach(meeting => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${meeting.meeting_number || ''}</td>
                <td>${formatDateArabic(meeting.date)}</td>
                <td>${meeting.location || ''}</td>
                <td>${meeting.chairperson || ''}</td>
                <td>${meeting.secretary || ''}</td>
                <td>
                    <button class="btn btn-small btn-secondary view-meeting" data-id="${meeting.id}">عرض</button>
                    <button class="btn btn-small btn-success generate-minutes write-action" data-id="${meeting.id}">توليد المحضر</button>
                    ${authManager.isAdmin() ? `
                        <button class="btn btn-small btn-primary edit-meeting write-action" data-id="${meeting.id}">تعديل</button>
                        <button class="btn btn-small btn-danger delete-meeting write-action" data-id="${meeting.id}">حذف</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * Render members table
     */
    renderMembersTable(members) {
        const tbody = document.querySelector('#members-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا يوجد أعضاء</td></tr>';
            return;
        }

        members.forEach(member => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${member.name || ''}</td>
                <td>${member.role || ''}</td>
                <td>${member.email || ''}</td>
                <td>
                    ${authManager.isAdmin() ? `
                        <button class="btn btn-small btn-primary edit-member write-action" data-id="${member.id}">تعديل</button>
                        <button class="btn btn-small btn-danger delete-member write-action" data-id="${member.id}">حذف</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * Update KPI cards
     */
    updateKPIs(decisions) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const total = decisions.length;
        const implemented = decisions.filter(d => d.status === 'implemented').length;
        const inProgress = decisions.filter(d => d.status === 'in_progress').length;
        
        const overdue = decisions.filter(d => {
            if (d.status === 'implemented') return false;
            if (!d.due_date) return false;
            return new Date(d.due_date) < today;
        }).length;

        document.getElementById('kpi-total').textContent = total;
        document.getElementById('kpi-implemented').textContent = implemented;
        document.getElementById('kpi-progress').textContent = inProgress;
        document.getElementById('kpi-overdue').textContent = overdue;
    }

    /**
     * Populate filter dropdowns
     */
    populateFilterDropdowns(decisions) {
        const partySelect = document.getElementById('filter-party');
        if (!partySelect) return;

        const parties = [...new Set(decisions.map(d => d.responsible_party).filter(Boolean))];
        
        partySelect.innerHTML = '<option value="">جميع الأطراف المسؤولة</option>';
        parties.forEach(party => {
            const option = document.createElement('option');
            option.value = party;
            option.textContent = party;
            partySelect.appendChild(option);
        });
    }

    /**
     * Get form HTML for different entities
     */
    getFormHTML(type, data = {}) {
        switch (type) {
            case 'meeting':
                return `
                    <form id="entity-form" class="entity-form">
                        <input type="hidden" name="id" value="${data.id || ''}">
                        <div class="form-group">
                            <label for="meeting_number">رقم الاجتماع *</label>
                            <input type="text" id="meeting_number" name="meeting_number" required value="${data.meeting_number || ''}">
                        </div>
                        <div class="form-group">
                            <label for="date">التاريخ *</label>
                            <input type="date" id="date" name="date" required value="${data.date || ''}">
                        </div>
                        <div class="form-group">
                            <label for="location">المكان *</label>
                            <input type="text" id="location" name="location" required value="${data.location || ''}">
                        </div>
                        <div class="form-group">
                            <label for="chairperson">الرئيس *</label>
                            <input type="text" id="chairperson" name="chairperson" required value="${data.chairperson || ''}">
                        </div>
                        <div class="form-group">
                            <label for="secretary">السكرتير *</label>
                            <input type="text" id="secretary" name="secretary" required value="${data.secretary || ''}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">حفظ</button>
                            <button type="button" class="btn btn-secondary" onclick="uiManager.hideModal()">إلغاء</button>
                        </div>
                    </form>
                `;

            case 'decision':
                const meetings = data.meetings || [];
                return `
                    <form id="entity-form" class="entity-form">
                        <input type="hidden" name="id" value="${data.id || ''}">
                        <div class="form-group">
                            <label for="decision_number">رقم القرار *</label>
                            <input type="text" id="decision_number" name="decision_number" required value="${data.decision_number || ''}" ${data.id ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="meeting_id">الاجتماع المرتبط</label>
                            <select id="meeting_id" name="meeting_id">
                                <option value="">غير مرتبط باجتماع محدد</option>
                                ${meetings.map(m => `
                                    <option value="${m.id}" ${data.meeting_id === m.id ? 'selected' : ''}>
                                        ${m.meeting_number} - ${formatDateArabic(m.date)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="decision_text">نص القرار *</label>
                            <textarea id="decision_text" name="decision_text" rows="4" required>${data.decision_text || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="responsible_party">الطرف المسؤول *</label>
                            <input type="text" id="responsible_party" name="responsible_party" required value="${data.responsible_party || ''}">
                        </div>
                        <div class="form-group">
                            <label for="due_date">تاريخ الاستحقاق *</label>
                            <input type="date" id="due_date" name="due_date" required value="${data.due_date || ''}">
                        </div>
                        <div class="form-group">
                            <label for="status">الحالة *</label>
                            <select id="status" name="status" required>
                                <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>معلقة</option>
                                <option value="in_progress" ${data.status === 'in_progress' ? 'selected' : ''}>قيد التنفيذ</option>
                                <option value="implemented" ${data.status === 'implemented' ? 'selected' : ''}>منفذة</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="notes">ملاحظات</label>
                            <textarea id="notes" name="notes" rows="2">${data.notes || ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">حفظ</button>
                            <button type="button" class="btn btn-secondary" onclick="uiManager.hideModal()">إلغاء</button>
                        </div>
                    </form>
                `;

            case 'member':
                return `
                    <form id="entity-form" class="entity-form">
                        <input type="hidden" name="id" value="${data.id || ''}">
                        <div class="form-group">
                            <label for="name">الاسم *</label>
                            <input type="text" id="name" name="name" required value="${data.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="role">الدور *</label>
                            <input type="text" id="role" name="role" required value="${data.role || ''}">
                        </div>
                        <div class="form-group">
                            <label for="email">البريد الإلكتروني *</label>
                            <input type="email" id="email" name="email" required value="${data.email || ''}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">حفظ</button>
                            <button type="button" class="btn btn-secondary" onclick="uiManager.hideModal()">إلغاء</button>
                        </div>
                    </form>
                `;

            case 'agenda_item':
                return `
                    <form id="entity-form" class="entity-form">
                        <input type="hidden" name="id" value="${data.id || ''}">
                        <input type="hidden" name="meeting_id" value="${data.meeting_id || ''}">
                        <div class="form-group">
                            <label for="subject">الموضوع *</label>
                            <input type="text" id="subject" name="subject" required value="${data.subject || ''}">
                        </div>
                        <div class="form-group">
                            <label for="presenter">المقدم *</label>
                            <input type="text" id="presenter" name="presenter" required value="${data.presenter || ''}">
                        </div>
                        <div class="form-group">
                            <label for="type">النوع *</label>
                            <select id="type" name="type" required>
                                <option value="decision" ${data.type === 'decision' ? 'selected' : ''}>قرار</option>
                                <option value="informational" ${data.type === 'informational' ? 'selected' : ''}>معلوماتي</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">حفظ</button>
                            <button type="button" class="btn btn-secondary" onclick="uiManager.hideModal()">إلغاء</button>
                        </div>
                    </form>
                `;

            case 'attendee':
                const allMembers = data.members || [];
                return `
                    <form id="entity-form" class="entity-form">
                        <input type="hidden" name="id" value="${data.id || ''}">
                        <input type="hidden" name="meeting_id" value="${data.meeting_id || ''}">
                        <div class="form-group">
                            <label for="member_id">العضو *</label>
                            <select id="member_id" name="member_id" required>
                                <option value="">اختر العضو...</option>
                                ${allMembers.map(m => `
                                    <option value="${m.id}" ${data.member_id === m.id ? 'selected' : ''}>
                                        ${m.name} (${m.role})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="status">حالة الحضور *</label>
                            <select id="status" name="status" required>
                                <option value="present" ${data.status === 'present' ? 'selected' : ''}>حاضر</option>
                                <option value="absent" ${data.status === 'absent' ? 'selected' : ''}>غائب</option>
                                <option value="excused" ${data.status === 'excused' ? 'selected' : ''}>معتذر</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">حفظ</button>
                            <button type="button" class="btn btn-secondary" onclick="uiManager.hideModal()">إلغاء</button>
                        </div>
                    </form>
                `;

            default:
                return '';
        }
    }
}

// Create global instance
window.uiManager = new UIManager();
