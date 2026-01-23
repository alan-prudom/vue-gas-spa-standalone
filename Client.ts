/**
 * Vue + Bootstrap Demo: Client Logic with Full I18n
 */

// Import locale files
import { locales, type LocaleCode } from './locales/index';

// Since we are in a GAS environment, we assume TranslationManager is on the global scope
const { TranslationManager } = (window as any).Shared.TranslationManager;

const tasksInitial = [
    { id: "1", title: "Draft Quarterly Report", description: "Collect data from all departments and summarize the progress on key objectives.", isTranslated: false, isTranslating: false },
    { id: "2", title: "Team Sync Meeting", description: "Weekly check-in to discuss blockers and align on next week's sprint goals.", isTranslated: false, isTranslating: false },
    { id: "3", title: "Update Documentation", description: "Review and refresh the API integration guides to reflect recent architectural changes.", isTranslated: false, isTranslating: false },
    { id: "4", title: "Fix UI Regression", description: "Investigate and resolve the alignment issue reported in the mobile navigation menu.", isTranslated: false, isTranslating: false },
    { id: "5", title: "Performance Audit", description: "Analyze core web vitals and identify optimization opportunities for the landing page.", isTranslated: false, isTranslating: false }
];

const { createApp, ref, computed, onMounted, watch } = (window as any).Vue;

const app = createApp({
    setup() {
        const tasks = ref(tasksInitial.map(t => ({ ...t })));
        const currentLocale = ref('en');
        const tm = TranslationManager.getInstance();

        const localesMap: Record<string, string> = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'pt': 'Portuguese',
            'pl': 'Polish'
        };

        // Reactive UI strings based on current locale
        const ui = computed(() => locales[currentLocale.value]);

        const currentLocaleName = computed(() => localesMap[currentLocale.value]);
        const translatedCount = computed(() => tasks.value.filter(t => t.isTranslated).length);
        const pendingCount = computed(() => tasks.value.length - translatedCount.value);

        // 1. Configure TranslationManager in HEADLESS MODE
        tm.configure({
            i18nService: {
                getCurrentLocale: () => currentLocale.value,
                subscribe: (cb: any) => { /* Not needed for demo */ }
            },
            gasTranslationFunction: 'performTranslation',

            // Callback to deliver results to Vue's reactive state (HEADLESS MODE)
            onTranslationComplete: (id: string, result: any) => {
                const task = tasks.value.find(t => t.id === id);
                if (task) {
                    task.title = result.title;
                    task.description = result.description;
                    task.isTranslated = true;
                    task.isTranslating = false;
                }
            },
            onError: (id: string, err: any) => {
                console.error(`Error translating ${id}:`, err);
                const task = tasks.value.find(t => t.id === id);
                if (task) task.isTranslating = false;
            }
        });

        const setLanguage = (locale: LocaleCode) => {
            if (locale === 'en') {
                // Return to original state
                tasks.value = tasksInitial.map(t => ({ ...t }));
                currentLocale.value = 'en';
                return;
            }

            currentLocale.value = locale;

            // Flag tasks as translating
            tasks.value.forEach(t => {
                t.isTranslated = false;
                t.isTranslating = true;
            });

            // Trigger background translation for the batch
            tm.processBatch(tasks.value);
        };

        return {
            tasks,
            ui,
            currentLocaleName,
            translatedCount,
            pendingCount,
            setLanguage
        };
    }
});

app.mount('#app');
