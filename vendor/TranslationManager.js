/**
 * TranslationManager.ts
 * Core logic for the background translation system.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { PersistentQueue } from './PersistentQueue';
import { TranslationWindow } from './TranslationWindow';
import { TranslationCache } from './TranslationCache';
var TranslationManager = /** @class */ (function () {
    function TranslationManager() {
        this.isProcessing = false;
        this.localeSubscriptionSet = false;
        this.needsRescan = false;
    }
    TranslationManager.getInstance = function () {
        if (!TranslationManager.instance) {
            TranslationManager.instance = new TranslationManager();
        }
        return TranslationManager.instance;
    };
    /**
     * Configure the manager with application-specific settings
     */
    TranslationManager.prototype.configure = function (config) {
        this.config = __assign({ delay: 100, gasTranslationFunction: 'performTranslation' }, config);
        if (!this.config.selectors && !this.config.onTranslationComplete) {
            throw new Error('[TranslationManager] config.onTranslationComplete is required when using headless mode (no selectors)');
        }
        if (!this.localeSubscriptionSet) {
            this.config.i18nService.subscribe(function () {
                // Clear state when language changes?
                // Usually we just let the next batch handle it.
            });
            this.localeSubscriptionSet = true;
        }
        console.log('[TranslationManager] Configured');
    };
    /**
     * Process a batch of entries and determine what needs translation based on viewport
     */
    TranslationManager.prototype.processBatch = function (entries) {
        return __awaiter(this, void 0, void 0, function () {
            var currentLocale, visibilityData, batchIds, queuedId;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config)
                            return [2 /*return*/];
                        if (this.isProcessing) {
                            console.log('[TranslationManager] Already processing. Flagging rescan.');
                            this.needsRescan = true;
                            return [2 /*return*/];
                        }
                        currentLocale = this.config.i18nService.getCurrentLocale();
                        if (currentLocale === 'en')
                            return [2 /*return*/]; // Don't translate English
                        visibilityData = entries.map(function (entry) {
                            var isViewable = false;
                            if (_this.config.selectors) {
                                var container = document.querySelector(_this.config.selectors.container.replace('{id}', entry.id));
                                isViewable = container ? _this.isInViewport(container) : false;
                            }
                            // Check if already translated or being translated
                            var isTranslated = entry.isTranslated;
                            return {
                                id: entry.id,
                                isViewable: isViewable,
                                needsTranslation: !isTranslated
                            };
                        });
                        batchIds = TranslationWindow.getBatch(visibilityData);
                        if (batchIds.length === 0) {
                            queuedId = PersistentQueue.pop();
                            if (queuedId) {
                                batchIds.push(queuedId);
                            }
                        }
                        if (!(batchIds.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.processBatchIds(batchIds, entries)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Check if we need to scan again (new entries arrived while processing)
                        if (this.needsRescan) {
                            console.log('[TranslationManager] Running deferred rescan...');
                            this.needsRescan = false;
                            // Short delay to let DOM settle
                            setTimeout(function () { return _this.processBatch(entries); }, 50);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Restore original English text for all entries
     */
    TranslationManager.prototype.restoreOriginals = function (entries) {
        entries.forEach(function (entry) {
            if (entry.isTranslated) {
                entry.title = entry.originalTitle || entry.title;
                entry.description = entry.originalDescription || entry.description;
                entry.isTranslated = false;
                entry.originalTitle = undefined;
                entry.originalDescription = undefined;
            }
        });
    };
    TranslationManager.prototype.processBatchIds = function (ids, allEntries) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, _i, ids_1, id;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isProcessing = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 6, 7]);
                        _loop_1 = function (id) {
                            var entry, err_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        entry = allEntries.find(function (e) { return e.id === id; });
                                        if (!entry)
                                            return [2 /*return*/, "continue"];
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 4, , 5]);
                                        return [4 /*yield*/, this_1.translateEntry(entry)];
                                    case 2:
                                        _b.sent();
                                        // Artificial delay to prevent overlapping GAS calls
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.config.delay || 100); })];
                                    case 3:
                                        // Artificial delay to prevent overlapping GAS calls
                                        _b.sent();
                                        return [3 /*break*/, 5];
                                    case 4:
                                        err_1 = _b.sent();
                                        console.warn("[TranslationManager] Failed to translate ".concat(id, ":"), err_1);
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, ids_1 = ids;
                        _a.label = 2;
                    case 2:
                        if (!(_i < ids_1.length)) return [3 /*break*/, 5];
                        id = ids_1[_i];
                        return [5 /*yield**/, _loop_1(id)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        this.isProcessing = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    TranslationManager.prototype.translateEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            var locale, cached;
            var _this = this;
            return __generator(this, function (_a) {
                locale = this.config.i18nService.getCurrentLocale();
                cached = TranslationCache.get(entry.id, locale);
                if (cached) {
                    this.applyTranslation(entry, cached);
                    return [2 /*return*/];
                }
                // 2. Call GAS
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var gasFunction = _this.config.gasTranslationFunction || 'performTranslation';
                        // @ts-ignore
                        google.script.run
                            .withSuccessHandler(function (result) {
                            // Cache it
                            TranslationCache.set(entry.id, locale, {
                                hash: 'fixed', // Could use content hash later
                                title: result.title,
                                description: result.description
                            });
                            _this.applyTranslation(entry, result);
                            PersistentQueue.remove(entry.id);
                            if (_this.config.onTranslationComplete) {
                                _this.config.onTranslationComplete(entry.id, result);
                            }
                            resolve();
                        })
                            .withFailureHandler(function (err) {
                            PersistentQueue.push(entry.id);
                            if (_this.config.onTranslationError) {
                                _this.config.onTranslationError(entry.id, err);
                            }
                            reject(err);
                        })[gasFunction]({
                            id: entry.id,
                            locale: locale,
                            context: entry.calendarId
                        });
                    })];
            });
        });
    };
    TranslationManager.prototype.applyTranslation = function (entry, result) {
        var _a, _b;
        var _c, _d;
        if (!entry.isTranslated) {
            entry.originalTitle = entry.title;
            entry.originalDescription = entry.description;
        }
        entry.title = result.title;
        entry.description = result.description;
        entry.isTranslated = true;
        // Apply to DOM if selectors are configured
        if (this.config.selectors) {
            var container = document.querySelector(this.config.selectors.container.replace('{id}', entry.id));
            if (container) {
                var titleEl = container.querySelector(this.config.selectors.title);
                var descEl = container.querySelector(this.config.selectors.description);
                if (titleEl) {
                    titleEl.innerHTML = result.title;
                    if ((_c = this.config.translatedClasses) === null || _c === void 0 ? void 0 : _c.title) {
                        (_a = titleEl.classList).add.apply(_a, this.config.translatedClasses.title);
                    }
                }
                if (descEl) {
                    descEl.innerHTML = result.description;
                    if ((_d = this.config.translatedClasses) === null || _d === void 0 ? void 0 : _d.description) {
                        (_b = descEl.classList).add.apply(_b, this.config.translatedClasses.description);
                    }
                }
            }
        }
    };
    TranslationManager.prototype.isInViewport = function (element) {
        var rect = element.getBoundingClientRect();
        var windowHeight = (window.innerHeight || document.documentElement.clientHeight);
        var windowWidth = (window.innerWidth || document.documentElement.clientWidth);
        // More lenient: check if any part of the element is in the viewport
        return (rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < windowHeight &&
            rect.left < windowWidth);
    };
    return TranslationManager;
}());
export { TranslationManager };
