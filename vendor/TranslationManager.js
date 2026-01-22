"use strict";
var TranslationManagerLibrary = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // Shared/TranslationManager/src/TranslationManager.ts
  var TranslationManager_exports = {};
  __export(TranslationManager_exports, {
    TranslationManager: () => TranslationManager
  });

  // Shared/TranslationManager/src/PersistentQueue.ts
  var PersistentQueue = class {
    /**
     * Push an ID to the queue if not already present
     */
    static push(id) {
      const queue = this.get();
      if (!queue.includes(id)) {
        queue.push(id);
        this.save(queue);
      }
    }
    /**
     * Remove an ID from the queue
     */
    static remove(id) {
      const queue = this.get().filter((item) => item !== id);
      this.save(queue);
    }
    /**
     * Get all IDs in the queue
     */
    static get() {
      try {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.warn("[PersistentQueue] Read failed:", e);
        return [];
      }
    }
    /**
     * Pop the next ID from the queue
     */
    static pop() {
      const queue = this.get();
      if (queue.length === 0) return null;
      const next = queue.shift();
      this.save(queue);
      return next || null;
    }
    /**
     * Clear the queue
     */
    static clear() {
      localStorage.removeItem(this.KEY);
    }
    static save(queue) {
      try {
        localStorage.setItem(this.KEY, JSON.stringify(queue));
      } catch (e) {
        console.warn("[PersistentQueue] Save failed:", e);
      }
    }
  };
  PersistentQueue.KEY = "translationQueue";

  // Shared/TranslationManager/src/TranslationWindow.ts
  var TranslationWindow = class {
    /**
     * Calculates the best batch of entries to translate next.
     * Prioritizes visible entries, then older queued entries.
     * @param entries List of all entries with their visibility and translation status.
     * @returns List of entry IDs to process in this batch.
     */
    static getBatch(entries) {
      const candidates = entries.filter((e) => e.needsTranslation);
      if (candidates.length === 0) return [];
      const visible = candidates.filter((e) => e.isViewable);
      const nonVisible = candidates.filter((e) => !e.isViewable);
      const batch = [];
      visible.slice(0, this.MAX_BATCH_SIZE).forEach((e) => batch.push(e.id));
      if (batch.length < this.RECOMENDED_BATCH_SIZE) {
        const remainingSpace = this.RECOMENDED_BATCH_SIZE - batch.length;
        nonVisible.slice(0, remainingSpace).forEach((e) => batch.push(e.id));
      }
      return batch;
    }
  };
  TranslationWindow.MAX_BATCH_SIZE = 15;
  TranslationWindow.RECOMENDED_BATCH_SIZE = 12;

  // Shared/TranslationManager/src/TranslationCache.ts
  var TranslationCache = class {
    /**
     * Get a cached translation
     */
    static get(id, locale) {
      try {
        const key = this.getKey(id, locale);
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    }
    /**
     * Set a cached translation
     */
    static set(id, locale, entry) {
      try {
        const key = this.getKey(id, locale);
        sessionStorage.setItem(key, JSON.stringify(entry));
      } catch (e) {
      }
    }
    /**
     * Clear cache for a specific entry and locale
     */
    static clear(id, locale) {
      sessionStorage.removeItem(this.getKey(id, locale));
    }
    /**
     * Clear all cache for a specific locale
     */
    static clearAll(locale) {
      const prefix = `${this.PREFIX}${locale}_`;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          sessionStorage.removeItem(key);
          i--;
        }
      }
    }
    static getKey(id, locale) {
      return `${this.PREFIX}${locale}_${id}`;
    }
  };
  TranslationCache.PREFIX = "tm_cache_";

  // Shared/TranslationManager/src/TranslationManager.ts
  var TranslationManager = class _TranslationManager {
    constructor() {
      this.isProcessing = false;
      this.localeSubscriptionSet = false;
      this.needsRescan = false;
    }
    static getInstance() {
      if (!_TranslationManager.instance) {
        _TranslationManager.instance = new _TranslationManager();
      }
      return _TranslationManager.instance;
    }
    /**
     * Configure the manager with application-specific settings
     */
    configure(config) {
      this.config = __spreadValues({
        delay: 100,
        // Default 100ms delay
        gasTranslationFunction: "performTranslation"
      }, config);
      if (!this.config.selectors && !this.config.onTranslationComplete) {
        throw new Error("[TranslationManager] config.onTranslationComplete is required when using headless mode (no selectors)");
      }
      if (!this.localeSubscriptionSet) {
        this.config.i18nService.subscribe(() => {
        });
        this.localeSubscriptionSet = true;
      }
      console.log("[TranslationManager] Configured");
    }
    /**
     * Process a batch of entries and determine what needs translation based on viewport
     */
    processBatch(entries) {
      return __async(this, null, function* () {
        if (!this.config) return;
        if (this.isProcessing) {
          console.log("[TranslationManager] Already processing. Flagging rescan.");
          this.needsRescan = true;
          return;
        }
        const currentLocale = this.config.i18nService.getCurrentLocale();
        if (currentLocale === "en") return;
        const visibilityData = entries.map((entry) => {
          let isViewable = false;
          if (this.config.selectors) {
            const container = document.querySelector(this.config.selectors.container.replace("{id}", entry.id));
            isViewable = container ? this.isInViewport(container) : false;
          }
          const isTranslated = entry.isTranslated;
          return {
            id: entry.id,
            isViewable,
            needsTranslation: !isTranslated
          };
        });
        const batchIds = TranslationWindow.getBatch(visibilityData);
        if (batchIds.length === 0) {
          const queuedId = PersistentQueue.pop();
          if (queuedId) {
            batchIds.push(queuedId);
          }
        }
        if (batchIds.length > 0) {
          yield this.processBatchIds(batchIds, entries);
        }
        if (this.needsRescan) {
          console.log("[TranslationManager] Running deferred rescan...");
          this.needsRescan = false;
          setTimeout(() => this.processBatch(entries), 50);
        }
      });
    }
    /**
     * Restore original English text for all entries
     */
    restoreOriginals(entries) {
      entries.forEach((entry) => {
        if (entry.isTranslated) {
          entry.title = entry.originalTitle || entry.title;
          entry.description = entry.originalDescription || entry.description;
          entry.isTranslated = false;
          entry.originalTitle = void 0;
          entry.originalDescription = void 0;
        }
      });
    }
    processBatchIds(ids, allEntries) {
      return __async(this, null, function* () {
        this.isProcessing = true;
        try {
          for (const id of ids) {
            const entry = allEntries.find((e) => e.id === id);
            if (!entry) continue;
            try {
              yield this.translateEntry(entry);
              yield new Promise((resolve) => setTimeout(resolve, this.config.delay || 100));
            } catch (err) {
              console.warn(`[TranslationManager] Failed to translate ${id}:`, err);
            }
          }
        } finally {
          this.isProcessing = false;
        }
      });
    }
    translateEntry(entry) {
      return __async(this, null, function* () {
        const locale = this.config.i18nService.getCurrentLocale();
        const cached = TranslationCache.get(entry.id, locale);
        if (cached) {
          this.applyTranslation(entry, cached);
          return;
        }
        return new Promise((resolve, reject) => {
          const gasFunction = this.config.gasTranslationFunction || "performTranslation";
          google.script.run.withSuccessHandler((result) => {
            TranslationCache.set(entry.id, locale, {
              hash: "fixed",
              // Could use content hash later
              title: result.title,
              description: result.description
            });
            this.applyTranslation(entry, result);
            PersistentQueue.remove(entry.id);
            if (this.config.onTranslationComplete) {
              this.config.onTranslationComplete(entry.id, result);
            }
            resolve();
          }).withFailureHandler((err) => {
            PersistentQueue.push(entry.id);
            if (this.config.onTranslationError) {
              this.config.onTranslationError(entry.id, err);
            }
            reject(err);
          })[gasFunction]({
            id: entry.id,
            locale,
            context: entry.calendarId
          });
        });
      });
    }
    applyTranslation(entry, result) {
      var _a, _b;
      if (!entry.isTranslated) {
        entry.originalTitle = entry.title;
        entry.originalDescription = entry.description;
      }
      entry.title = result.title;
      entry.description = result.description;
      entry.isTranslated = true;
      if (this.config.selectors) {
        const container = document.querySelector(this.config.selectors.container.replace("{id}", entry.id));
        if (container) {
          const titleEl = container.querySelector(this.config.selectors.title);
          const descEl = container.querySelector(this.config.selectors.description);
          if (titleEl) {
            titleEl.innerHTML = result.title;
            if ((_a = this.config.translatedClasses) == null ? void 0 : _a.title) {
              titleEl.classList.add(...this.config.translatedClasses.title);
            }
          }
          if (descEl) {
            descEl.innerHTML = result.description;
            if ((_b = this.config.translatedClasses) == null ? void 0 : _b.description) {
              descEl.classList.add(...this.config.translatedClasses.description);
            }
          }
        }
      }
    }
    isInViewport(element) {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;
      return rect.bottom > 0 && rect.right > 0 && rect.top < windowHeight && rect.left < windowWidth;
    }
  };
  return __toCommonJS(TranslationManager_exports);
})();
if (typeof Shared === "undefined") Shared = {}; if (typeof Shared.TranslationManager === "undefined") Shared.TranslationManager = TranslationManagerLibrary;
