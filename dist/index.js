"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var kv_asset_handler_1 = require("@cloudflare/kv-asset-handler");
var sentry_1 = require("./sentry");
var genEtag = function (hash) { return "W/\"" + hash + "\""; };
var normalizePath = function (pathname) { return ('/' + pathname).replace(/\/+/g, '/'); };
var resolvePath = function (pathname, basepath) {
    if (basepath) {
        // Remove mount point prefixes. Note, mount points basically must be a "directory".
        // If somebody concocts a scenario where this is not the case, let Heath know.
        // FIXME: With prefix /prefix, /prefixing => /ing
        return normalizePath(pathname).replace(new RegExp("^" + basepath), '');
    }
    return pathname;
};
function init(config) {
    // Note, mount points basically must be a "directory".
    // If somebody concocts a scenario where this is not the case, let Heath know.
    return __assign(__assign({}, config), { basepath: normalizePath(config.basepath).replace(/\/$/g, '') });
}
function getOptionsEventListener(config) {
    return function (event) {
        if (event.request.method === 'OPTIONS') {
            event.respondWith(handlerHandler(config, event, handleOptionsRequest));
        }
    };
}
function getRequestEventListener(config) {
    return function (event) {
        event.respondWith(handlerHandler(config, event, handleEvent));
    };
}
function handlerHandler(config, event, fn) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var e_1, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fn.apply(void 0, __spreadArrays([config, event], args))];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_1 = _a.sent();
                    event.waitUntil(sentry_1.default.captureException(config, e_1, event.request));
                    message = config.debug ? e_1.message || e_1.toString() : 'Internal Error';
                    return [2 /*return*/, new Response(message, { status: 500 })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleOptionsRequest(config, event) {
    var request = event.request;
    var cors = config.manifest.cors;
    var headers = new Headers();
    if (cors &&
        request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null) {
        if (cors.origin) {
            headers.set('Access-Control-Allow-Origin', cors.origin);
            headers.set('Vary', 'Origin');
        }
        if (cors.methods) {
            headers.set('Access-Control-Allow-Methods', cors.methods.join(', '));
        }
        if (cors.headers) {
            headers.set('Access-Control-Allow-Headers', cors.headers.join(', '));
        }
        if (cors.maxAge) {
            headers.set('Access-Control-Max-Age', cors.maxAge);
        }
    }
    else {
        // Handle standard OPTIONS request
        headers.set('Allow', 'GET, HEAD, OPTIONS');
    }
    return new Response(null, { status: 204, headers: headers });
}
function handleEvent(config, event) {
    return __awaiter(this, void 0, void 0, function () {
        var response, parsedUrl, pathname;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, handleRequest(config, event)];
                case 1:
                    response = _a.sent();
                    if (!(response.status === 404 && config.spaFallback)) return [3 /*break*/, 3];
                    parsedUrl = new URL(event.request.url);
                    pathname = resolvePath(parsedUrl.pathname, config.basepath);
                    if (pathname === config.spaFallback) {
                        throw new Error("Unrecognized SPA fallback: " + config.spaFallback);
                    }
                    config.manifest.aliases[pathname] = config.spaFallback;
                    return [4 /*yield*/, handleRequest(config, event)];
                case 2:
                    response = _a.sent();
                    _a.label = 3;
                case 3:
                    if (config.manifest.cors && config.manifest.cors.origin) {
                        response.headers.set('Access-Control-Allow-Origin', config.manifest.cors.origin);
                        response.headers.set('Vary', 'Origin');
                    }
                    return [2 /*return*/, response];
            }
        });
    });
}
function handleRedirect(pathname) {
    var response = new Response('Found', {
        status: 302,
        headers: { Location: pathname },
    });
    return applyResponseHeaders(response, null);
}
function handleRequest(config, event) {
    return __awaiter(this, void 0, void 0, function () {
        var parsedUrl, pathname, pathRedirect, pathAlias, pathManifest, response_1, response_2, mapRequestToAsset, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parsedUrl = new URL(event.request.url);
                    if (parsedUrl.pathname === config.basepath) {
                        return [2 /*return*/, handleRedirect(config.basepath + '/')];
                    }
                    pathname = resolvePath(parsedUrl.pathname, config.basepath);
                    pathRedirect = config.manifest.redirects[pathname];
                    pathAlias = config.manifest.aliases[pathname];
                    pathManifest = config.manifest.paths[pathAlias || pathname];
                    if (pathRedirect) {
                        return [2 /*return*/, handleRedirect(config.basepath + pathRedirect)];
                    }
                    if (!pathManifest) {
                        response_1 = new Response('Not Found: ' + pathname, { status: 404 });
                        return [2 /*return*/, applyResponseHeaders(response_1, null)];
                    }
                    if (genEtag(pathManifest.hash) === event.request.headers.get('If-None-Match')) {
                        response_2 = new Response(null, { status: 304 });
                        return [2 /*return*/, applyResponseHeaders(response_2, pathManifest)];
                    }
                    mapRequestToAsset = function (req) {
                        if (pathAlias) {
                            return new Request(parsedUrl.origin + pathAlias, req);
                        }
                        else {
                            return new Request(parsedUrl.origin + pathname, req);
                        }
                    };
                    return [4 /*yield*/, kv_asset_handler_1.getAssetFromKV(event, {
                            mapRequestToAsset: mapRequestToAsset,
                            cacheControl: { bypassCache: !!config.debug },
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, applyResponseHeaders(response, pathManifest)];
            }
        });
    });
}
function applyResponseHeaders(response, pathManifest) {
    if (pathManifest && pathManifest.cacheControl) {
        response.headers.set('Cache-Control', pathManifest.cacheControl);
    }
    if (pathManifest && pathManifest.hash) {
        response.headers.set('ETag', genEtag(pathManifest.hash));
    }
    return response;
}
exports.default = {
    init: init,
    getOptionsEventListener: getOptionsEventListener,
    getRequestEventListener: getRequestEventListener
};
