/**
 * Vue + Bootstrap Demo: Client Logic
 */

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
            // OPTIONAL: No selectors provided! TM will work but not touch the DOM.

            // Required in Headless mode: callback to deliver results
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

        const setLanguage = (locale: string) => {
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

        // Simulating Viewport Priority
        // In a real headless app, you would pass visibility data to the manager
        // if your framework handles intersection observation.
        // For this demo, we'll let the manager use its internal visibility check
        // by providing the container selector TEMPORARILY just for the prioritization part.
        // BUT wait, if we want TRUE headless, we'd handle visibility here.

        // Let's stick to the "Hybrid" Headless:
        // We tell TM where the cards are so it can prioritize,
        // but it won't touch their content.
        tm.configure({
            ...tm.config,
            selectors: {
                container: '[data-id="{id}"]',
                title: 'DUMMY',  // Won't be used since we update in callback
                description: 'DUMMY'
            }
        });

        return {
            tasks,
            currentLocaleName,
            translatedCount,
            pendingCount,
            setLanguage
        };
    }
});

app.mount('#app');
