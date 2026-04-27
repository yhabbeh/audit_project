/**
 * AI Helper - Integration with Claude/Anthropic API
 * Provides text improvement and duplicate detection
 */

class AIHelper {
    constructor() {
        this.apiKey = localStorage.getItem('claude_api_key') || '';
    }

    /**
     * Set API key
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('claude_api_key', key);
    }

    /**
     * Check if API key is configured
     */
    isConfigured() {
        return this.apiKey.length > 0;
    }

    /**
     * Improve decision text using Claude
     */
    async improveText(text) {
        if (!this.isConfigured()) {
            throw new Error('مفتاح API غير مكون. يرجى إدخاله في صفحة الإعدادات.');
        }

        const prompt = `قم بتحسين النص التالي ليصبح بصيغة رسمية ومناسبة لقرارات لجنة التدقيق باللغة العربية الفصحى. لا تضف أي شرح، فقط أعطي النص المحسن:

${text}`;

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'خطأ في الاتصال بـ Claude API');
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('AI improvement failed:', error);
            throw error;
        }
    }

    /**
     * Check for similar decisions (duplicate detection)
     */
    async checkDuplicates(newText, existingDecisions) {
        if (!this.isConfigured()) {
            // Fallback: simple string matching
            return this.simpleDuplicateCheck(newText, existingDecisions);
        }

        const existingTexts = existingDecisions.map(d => d.decision_text).join('\n---\n');

        const prompt = `قارن النص الجديد بالنصوص الموجودة وحدد ما إذا كان هناك تشابه كبير.

النص الجديد:
${newText}

النصوص الموجودة:
${existingTexts}

أجب فقط بـ "نعم" إذا كان هناك تشابه كبير، أو "لا" إذا لم يكن هناك تشابه. ثم اذكر أرقام القرارات المشابهة إن وجدت.`;

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 200,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('خطأ في الاتصال بـ Claude API');
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Duplicate check failed:', error);
            return this.simpleDuplicateCheck(newText, existingDecisions);
        }
    }

    /**
     * Simple duplicate check without AI (fallback)
     */
    simpleDuplicateCheck(newText, existingDecisions) {
        const normalizedNew = this.normalizeText(newText);
        const similar = [];

        existingDecisions.forEach(dec => {
            const normalizedExisting = this.normalizeText(dec.decision_text);
            
            // Check for exact match
            if (normalizedNew === normalizedExisting) {
                similar.push(dec);
                return;
            }

            // Check for significant overlap (simple word matching)
            const newWords = new Set(normalizedNew.split(/\s+/));
            const existingWords = new Set(normalizedExisting.split(/\s+/));
            
            let overlapCount = 0;
            newWords.forEach(word => {
                if (word.length > 3 && existingWords.has(word)) {
                    overlapCount++;
                }
            });

            const overlapRatio = overlapCount / Math.max(newWords.size, 1);
            if (overlapRatio > 0.5) {
                similar.push(dec);
            }
        });

        if (similar.length > 0) {
            return `تم العثور على قرارات مشابهة:\n` + 
                   similar.map(d => `- ${d.decision_number}: ${d.decision_text.substring(0, 50)}...`).join('\n');
        }

        return 'لا توجد قرارات مشابهة.';
    }

    /**
     * Normalize text for comparison
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s\u0600-\u06FF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Combined improvement and duplicate check
     */
    async improveAndCheck(newText, existingDecisions) {
        const [improved, duplicateCheck] = await Promise.all([
            this.improveText(newText),
            this.checkDuplicates(newText, existingDecisions)
        ]);

        return {
            improved,
            duplicateWarning: duplicateCheck.includes('نعم') || duplicateCheck.includes('تم العثور') ? duplicateCheck : null
        };
    }
}

// Create global instance
window.aiHelper = new AIHelper();
