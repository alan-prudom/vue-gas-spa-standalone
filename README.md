# Example: Vue + Bootstrap SPA (Headless Mode)

This example demonstrates how to integrate `TranslationManager` into a modern **Vue.js** application using **Bootstrap 5** for styling. It showcases the "Headless Mode," where the manager handles the complex orchestration of Google Apps Script calls but leaves the UI rendering to Vue's reactive system.

## Key Concepts

1.  **Headless Orchestration**: By not providing specific DOM selectors for title/description (or by using the results purely in a callback), the manager avoids fighting Vue for control of the DOM.
2.  **Reactive State Sync**: The `onTranslationComplete` callback is used to update the Vue `ref` or `reactive` state. Vue then handles the DOM update automatically.
3.  **Bootstrap Feedback**: We use Bootstrap's utility classes (`text-primary`, `fst-italic`, `badge`) to provide visual feedback to the user as translations arrive in the background.

## How to Deploy

1.  Create a new Apps Script project.
2.  Copy `Code.gs` and `Index.html` to the project.
3.  Include `TranslationManager.js` (from the `dist/` folder) as a script.
4.  Include `Client.ts` (compiled to JS) as a script.
5.  Deploy as a Web App.

## Technical Nuance

In this demo, the manager is configured with the `container` selector to enable **Viewport Prioritization**. This allows the manager to detect which task cards are visible to the user and translate those first, while the actual text insertion is still handled by Vue via the callback.
