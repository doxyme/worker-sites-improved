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
Object.defineProperty(exports, "__esModule", { value: true });
var uuidv4_1 = require("uuidv4");
// Indicates the name of the SDK client
var CLIENT_NAME = 'doxy-cf-sentry';
var CLIENT_VERSION = '1.0.0';
var RETRIES = 5;
// A very lazy approximation of the Sentry Javascript interface
exports.default = {
    captureMessage: captureMessage,
    captureException: captureException,
    captureEvent: captureEvent,
};
function captureMessage(config, formatted, extra) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, captureEvent(config, {
                    level: 'info',
                    message: { formatted: formatted },
                    extra: extra,
                })];
        });
    });
}
exports.captureMessage = captureMessage;
function captureException(config, err, request) {
    return __awaiter(this, void 0, void 0, function () {
        var errType, frames, extraKeys, data;
        var _a;
        return __generator(this, function (_b) {
            errType = err.name || (err.contructor || {}).name;
            frames = parse(err);
            extraKeys = Object.keys(err).filter(function (key) { return !['name', 'message', 'stack'].includes(key); });
            data = {
                message: errType + ': ' + (err.message || '<no message>'),
                exception: {
                    values: [
                        {
                            type: errType,
                            value: err.message,
                            stacktrace: frames.length ? { frames: frames.reverse() } : undefined,
                        },
                    ],
                },
                extra: extraKeys.length
                    ? (_a = {},
                        _a[errType] = extraKeys.reduce(function (obj, key) {
                            var _a;
                            return (__assign(__assign({}, obj), (_a = {}, _a[key] = err[key], _a)));
                        }, {}),
                        _a) : undefined,
            };
            return [2 /*return*/, captureEvent(config, data, request)];
        });
    });
}
exports.captureException = captureException;
function captureEvent(config, data, request) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, i, res, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    payload = __assign({ 
                        // No dashes allowed
                        event_id: uuidv4_1.uuid().replace(/-/g, ''), tags: { app: config.app }, platform: 'javascript', environment: config.env, server_name: config.app + "-" + config.env, timestamp: Date.now() / 1000, request: request && request.url
                            ? {
                                method: request.method,
                                url: request.url,
                                headers: request.headers,
                                data: request.body,
                            }
                            : undefined, release: config.release }, data);
                    i = 0;
                    _d.label = 1;
                case 1:
                    if (!(i <= RETRIES)) return [3 /*break*/, 5];
                    return [4 /*yield*/, fetch("https://sentry.io/api/" + config.sentryProjectId + "/store/", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Sentry-Auth': [
                                    'Sentry sentry_version=7',
                                    "sentry_client=" + CLIENT_NAME + "/" + CLIENT_VERSION,
                                    "sentry_key=" + config.sentryKey,
                                ].join(', '),
                            },
                            body: JSON.stringify(payload),
                        })];
                case 2:
                    res = _d.sent();
                    if (res.status === 200) {
                        return [2 /*return*/];
                    }
                    // We couldn't send to Sentry, try to log the response at least
                    _b = (_a = console).error;
                    _c = [{ httpStatus: res.status }];
                    return [4 /*yield*/, res.json()];
                case 3:
                    // We couldn't send to Sentry, try to log the response at least
                    _b.apply(_a, [__assign.apply(void 0, _c.concat([(_d.sent())]))]); // eslint-disable-line no-console
                    _d.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.captureEvent = captureEvent;
function parse(err) {
    return (err.stack || '')
        .split('\n')
        .slice(1)
        .map(function (line) {
        if (line.match(/^\s*[-]{4,}$/)) {
            return { filename: line };
        }
        // From https://github.com/felixge/node-stack-trace/blob/1ec9ba43eece124526c273c917104b4226898932/lib/stack-trace.js#L42
        var lineMatch = line.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
        if (!lineMatch) {
            return;
        }
        return {
            function: lineMatch[1] || undefined,
            filename: lineMatch[2] || undefined,
            lineno: +lineMatch[3] || undefined,
            colno: +lineMatch[4] || undefined,
            in_app: lineMatch[5] !== 'native' || undefined,
        };
    })
        .filter(Boolean);
}
/*
Forked from: https://github.com/bustle/cf-sentry

Copyright (c) 2019 Michael Hart and Bustle Digital Group

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/
