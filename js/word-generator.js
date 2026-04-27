/**
 * Word Report Generator - Generates .docx files for meeting minutes
 * Uses docx.js library loaded from CDN
 */

class WordGenerator {
    constructor() {
        this.docx = null;
    }

    /**
     * Initialize docx library from CDN if not already loaded
     */
    async init() {
        if (window.docx) {
            this.docx = window.docx;
            return true;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/docx@7.1.0/build/index.js';
            script.onload = () => {
                this.docx = window.docx;
                resolve(true);
            };
            script.onerror = () => reject(new Error('Failed to load docx library'));
            document.head.appendChild(script);
        });
    }

    /**
     * Generate meeting minutes as .docx file
     */
    async generateMeetingMinutes(meeting, attendees, agendaItems, decisions) {
        await this.init();

        const members = await db.getAll('members');
        const memberMap = new Map(members.map(m => [m.id, m]));

        // Build attendance table rows
        const attendanceRows = [
            new this.docx.TableRow({
                children: [
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('الاسم')] }),
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('الدور')] }),
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('الحالة')] })
                ]
            })
        ];

        attendees.forEach(att => {
            const member = memberMap.get(att.member_id);
            if (member) {
                attendanceRows.push(
                    new this.docx.TableRow({
                        children: [
                            new this.docx.TableCell({ children: [new this.docx.Paragraph(member.name || '')] }),
                            new this.docx.TableCell({ children: [new this.docx.Paragraph(member.role || '')] }),
                            new this.docx.TableCell({ children: [new this.docx.Paragraph(getAttendanceLabel(att.status) || '')] })
                        ]
                    })
                );
            }
        });

        // Build agenda items list
        const agendaParagraphs = agendaItems.map((item, index) => 
            new this.docx.Paragraph({
                text: `${index + 1}. ${item.subject || ''} - المقدم: ${item.presenter || ''}`,
                bidi: true,
                spacing: { after: 200 }
            })
        );

        // Build decisions table rows
        const decisionsRows = [
            new this.docx.TableRow({
                children: [
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('رقم القرار')] }),
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('نص القرار')] }),
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('المسؤول')] }),
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('تاريخ الاستحقاق')] }),
                    new this.docx.TableCell({ children: [new this.docx.Paragraph('الحالة')] })
                ]
            })
        ];

        decisions.forEach(dec => {
            decisionsRows.push(
                new this.docx.TableRow({
                    children: [
                        new this.docx.TableCell({ children: [new this.docx.Paragraph(dec.decision_number || '')] }),
                        new this.docx.TableCell({ children: [new this.docx.Paragraph(dec.decision_text || '')] }),
                        new this.docx.TableCell({ children: [new this.docx.Paragraph(dec.responsible_party || '')] }),
                        new this.docx.TableCell({ children: [new this.docx.Paragraph(formatDateArabic(dec.due_date) || '')] }),
                        new this.docx.TableCell({ children: [new this.docx.Paragraph(getStatusLabel(dec.status) || '')] })
                    ]
                })
            );
        });

        // Create the document
        const doc = new this.docx.Document({
            sections: [{
                properties: {},
                children: [
                    // Header
                    new this.docx.Paragraph({
                        text: 'محضر اجتماع لجنة التدقيق',
                        heading: this.docx.HeadingLevel.HEADING_1,
                        alignment: this.docx.AlignmentType.CENTER,
                        bidi: true,
                        spacing: { after: 400 }
                    }),

                    // Meeting Info
                    new this.docx.Paragraph({
                        text: `رقم الاجتماع: ${meeting.meeting_number || ''}`,
                        bidi: true,
                        spacing: { after: 100 }
                    }),
                    new this.docx.Paragraph({
                        text: `التاريخ: ${formatDateArabic(meeting.date)}`,
                        bidi: true,
                        spacing: { after: 100 }
                    }),
                    new this.docx.Paragraph({
                        text: `المكان: ${meeting.location || ''}`,
                        bidi: true,
                        spacing: { after: 100 }
                    }),
                    new this.docx.Paragraph({
                        text: `الرئيس: ${meeting.chairperson || ''}`,
                        bidi: true,
                        spacing: { after: 100 }
                    }),
                    new this.docx.Paragraph({
                        text: `السكرتير: ${meeting.secretary || ''}`,
                        bidi: true,
                        spacing: { after: 300 }
                    }),

                    // Attendance Section
                    new this.docx.Paragraph({
                        text: 'الحضور',
                        heading: this.docx.HeadingLevel.HEADING_2,
                        bidi: true,
                        spacing: { after: 200 }
                    }),
                    new this.docx.Table({
                        rows: attendanceRows,
                        width: { size: 100, type: this.docx.WidthType.PERCENTAGE }
                    }),
                    new this.docx.Paragraph({ text: '', spacing: { after: 300 } }),

                    // Agenda Items Section
                    new this.docx.Paragraph({
                        text: 'بنود جدول الأعمال',
                        heading: this.docx.HeadingLevel.HEADING_2,
                        bidi: true,
                        spacing: { after: 200 }
                    }),
                    ...agendaParagraphs,
                    new this.docx.Paragraph({ text: '', spacing: { after: 300 } }),

                    // Decisions Section
                    new this.docx.Paragraph({
                        text: 'القرارات',
                        heading: this.docx.HeadingLevel.HEADING_2,
                        bidi: true,
                        spacing: { after: 200 }
                    }),
                    new this.docx.Table({
                        rows: decisionsRows,
                        width: { size: 100, type: this.docx.WidthType.PERCENTAGE }
                    }),
                    new this.docx.Paragraph({ text: '', spacing: { after: 400 } }),

                    // Signatures Section
                    new this.docx.Paragraph({
                        text: 'التوقيعات',
                        heading: this.docx.HeadingLevel.HEADING_2,
                        bidi: true,
                        alignment: this.docx.AlignmentType.RIGHT,
                        spacing: { after: 300 }
                    }),
                    new this.docx.Paragraph({
                        text: `الرئيس: ${meeting.chairperson || ''}`,
                        bidi: true,
                        alignment: this.docx.AlignmentType.RIGHT,
                        spacing: { after: 100 }
                    }),
                    new this.docx.Paragraph({
                        text: '_________________________',
                        alignment: this.docx.AlignmentType.RIGHT,
                        spacing: { after: 300 }
                    }),
                    new this.docx.Paragraph({
                        text: `السكرتير: ${meeting.secretary || ''}`,
                        bidi: true,
                        alignment: this.docx.AlignmentType.RIGHT,
                        spacing: { after: 100 }
                    }),
                    new this.docx.Paragraph({
                        text: '_________________________',
                        alignment: this.docx.AlignmentType.RIGHT
                    })
                ]
            }]
        });

        // Generate and download
        const blob = await this.docx.Packer.toBlob(doc);
        const filename = `محضر_${meeting.meeting_number || 'اجتماع'}.docx`;
        
        this.downloadBlob(blob, filename);
        
        return true;
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.wordGenerator = new WordGenerator();
