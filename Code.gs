/**
 * Vue + Bootstrap Demo: Server Side
 *
 * Part of @shared/translation-manager examples.
 */

/**
 * Global entry point for the web app
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Vue + Bootstrap Translation Demo')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Mock translation function
 * In a real app, this would use LanguageApp or a translation API.
 */
function performTranslation(id, targetLang, context) {
  // Simulated database
  const mockTasks = {
    "1": { title: "Draft Quarterly Report", description: "Collect data from all departments and summarize the progress on key objectives." },
    "2": { title: "Team Sync Meeting", description: "Weekly check-in to discuss blockers and align on next week's sprint goals." },
    "3": { title: "Update Documentation", description: "Review and refresh the API integration guides to reflect recent architectural changes." },
    "4": { title: "Fix UI Regression", description: "Investigate and resolve the alignment issue reported in the mobile navigation menu." },
    "5": { title: "Performance Audit", description: "Analyze core web vitals and identify optimization opportunities for the landing page." }
  };

  const task = mockTasks[id] || { title: "Unknown Task", description: "No details available." };

  // Simulate network delay
  Utilities.sleep(500);

  try {
    // Real translation using GAS internal service
    return {
      title: LanguageApp.translate(task.title, 'en', targetLang),
      description: LanguageApp.translate(task.description, 'en', targetLang)
    };
  } catch (e) {
    // Fallback if quota exceeded during demo
    return {
      title: `[${targetLang}] ${task.title}`,
      description: `[${targetLang}] ${task.description}`
    };
  }
}

/**
 * Includes for HTML templates
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
