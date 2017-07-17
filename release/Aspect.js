"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var InterceptAdviceType = "interceptAdvices";
var BeforeAdviceType = "beforeAdvices";
var AfterAdviceType = "afterAdvices";
var AdviceTypes = [InterceptAdviceType, BeforeAdviceType, AfterAdviceType];
var AspectAdvices = (function () {
    function AspectAdvices(targetInstance, advices) {
        var _this = this;
        this.beforeAdvices = new Map();
        this.afterAdvices = new Map();
        this.interceptAdvices = new Map();
        advices.forEach(function (adviceFuncName) {
            var adviceFunc = targetInstance[adviceFuncName];
            var config = adviceFunc[Aspect.AdviceMark];
            var type = config.type, pointcut = config.pointcut;
            switch (type) {
                case Aspect.BeforeAdviceMark:
                    _this.addAdvice('beforeAdvices', pointcut, config);
                    break;
                case Aspect.AfterAdviceMark:
                    _this.addAdvice("afterAdvices", pointcut, config);
                    break;
                case Aspect.InterceptAdviceMark:
                    _this.addAdvice("interceptAdvices", pointcut, config);
                    break;
            }
        });
    }
    AspectAdvices.prototype.addAdvice = function (adviceName, pointcutName, config) {
        if (!this[adviceName]) {
            // console.log('adviceName error');
            return;
        }
        if (!this[adviceName].has(pointcutName)) {
            this[adviceName].set(pointcutName, []);
        }
        this[adviceName].get(pointcutName).push(config);
    };
    return AspectAdvices;
}());
var AspectProxy = (function () {
    function AspectProxy(targetName, targetClass, pointcuts) {
        var _this = this;
        this.id = 0;
        this.name = targetName;
        this.pointcuts = pointcuts;
        this.prototypeFunctions = new Map();
        this.proxyFunctions = new Map();
        this.advices = new Map();
        pointcuts.forEach(function (pointcutName) {
            _this.prototypeFunctions.set(pointcutName, targetClass.prototype[pointcutName]);
            _this.makeProxyFunction(pointcutName);
        });
    }
    AspectProxy.prototype.generateID = function () {
        return this.id++;
    };
    AspectProxy.prototype.hasAdvices = function (pointcutName) {
        if (this.advices.has(pointcutName)) {
            var advices = this.advices.get(pointcutName);
            return advices.beforeAdvices.length + advices.interceptAdvices.length + advices.afterAdvices.length > 0;
        }
        else {
            return false;
        }
    };
    AspectProxy.prototype.addAdvice = function (pointcutName, adviceType, item) {
        if (!this.advices.has(pointcutName)) {
            this.advices.set(pointcutName, {
                beforeAdvices: [],
                interceptAdvices: [],
                afterAdvices: []
            });
        }
        var advices = this.advices.get(pointcutName);
        var id = this.generateID();
        advices[adviceType].push(Object.assign(item, { id: id }));
        return id;
    };
    AspectProxy.prototype.removeAdvice = function (pointcutName, adviceType, id) {
        if (this.advices.has(pointcutName)) {
            var advices = this.advices.get(pointcutName)[adviceType];
            var index = advices.findIndex(function (item) { return item.id === id; });
            if (index !== -1) {
                advices.splice(index, 1);
            }
        }
    };
    AspectProxy.prototype.makeProxyFunction = function (pointcutName) {
        this.proxyFunctions.set(pointcutName, function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                var proxy, advices, i, _a, injector, config, stop, e_1, response;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            proxy = this[Aspect.AspectTarget];
                            advices = proxy.advices.get(pointcutName);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 6, , 7]);
                            i = 0;
                            _b.label = 2;
                        case 2:
                            if (!(i < advices.interceptAdvices.length)) return [3 /*break*/, 5];
                            _a = advices.interceptAdvices[i], injector = _a.injector, config = _a.config;
                            return [4 /*yield*/, injector[config.advice].apply(injector, args)];
                        case 3:
                            stop = _b.sent();
                            console.log('interceptors result', stop);
                            if (stop) {
                                return [2 /*return*/];
                            }
                            _b.label = 4;
                        case 4:
                            i++;
                            return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            e_1 = _b.sent();
                            return [2 /*return*/];
                        case 7:
                            // intercept 执行通过，说明可以执行，则执行before
                            advices.beforeAdvices.forEach(function (_a) {
                                var injector = _a.injector, config = _a.config;
                                injector[config.advice].apply(injector, args);
                            });
                            response = Reflect.apply(proxy.prototypeFunctions.get(pointcutName), this, args);
                            advices.afterAdvices.forEach(function (_a) {
                                var injector = _a.injector, config = _a.config;
                                injector[config.advice](response);
                            });
                            return [2 /*return*/, response];
                    }
                });
            });
        });
    };
    return AspectProxy;
}());
var Aspect = (function () {
    function Aspect() {
    }
    Aspect.getInstance = function () {
        if (!Aspect.instance) {
            Aspect.instance = new Aspect();
        }
        return Aspect.instance;
    };
    Aspect.prototype.target = function (targetName) {
        return function (targetClass) {
            // 使用代理来重新定义 Pointcut 装饰的方法，并在执行时监测
            var pointcuts = Object.keys(targetClass.prototype)
                .filter(function (pointcutName) { return (targetClass.prototype[pointcutName] instanceof Function && targetClass.prototype[pointcutName].hasOwnProperty(Aspect.PointcutMark)); });
            return new Proxy(targetClass, {
                construct: function (target, args) {
                    var instance = new (target.bind.apply(target, [void 0].concat(args)))();
                    instance[Aspect.AspectTarget] = new AspectProxy(targetName, targetClass, pointcuts);
                    return new Proxy(instance, {
                        get: function (target, name) {
                            var proxy = target[Aspect.AspectTarget];
                            if (proxy.pointcuts.indexOf(name) !== -1 && proxy.hasAdvices(name)) {
                                return proxy.proxyFunctions.get(name).bind(target);
                            }
                            else {
                                return target[name];
                            }
                        }
                    });
                }
            });
        };
    };
    Aspect.prototype.pointcut = function (target, pointcutName) {
        target[pointcutName][Aspect.PointcutMark] = true;
    };
    Aspect.prototype.advice = function (targetClass) {
        var advices = Object.keys(targetClass.prototype)
            .filter(function (adviceName) { return (targetClass.prototype[adviceName] instanceof Function && targetClass.prototype[adviceName].hasOwnProperty(Aspect.AdviceMark)); });
        return new Proxy(targetClass, {
            construct: function (target, args) {
                // const instance = Object.create(targetClass.prototype);
                // Reflect.apply(target, instance, args);
                var instance = new (target.bind.apply(target, [void 0].concat(args)))();
                instance[Aspect.AspectAdvice] = new AspectAdvices(instance, advices);
                if (instance[Aspect.AspectTarget]) {
                    return new Proxy(instance, {
                        get: function (target, name) {
                            var proxy = target[Aspect.AspectTarget];
                            if (proxy.proxyFunctions.has(name)) {
                                return proxy.proxyFunctions.get(name);
                            }
                            else {
                                return target[name];
                            }
                        }
                    });
                }
                else {
                    return instance;
                }
            }
        });
    };
    Aspect.prototype.weaving = function (target, injector) {
        var proxy = target[Aspect.AspectTarget];
        var advices = injector[Aspect.AspectAdvice];
        var disposers = [];
        if (!proxy || !(proxy instanceof AspectProxy)) {
            throw new Error(injector + " is not a advice");
        }
        // console.log(`weaving: target is  ${proxy.name}`);
        AdviceTypes.forEach(function (adviceType) {
            advices[adviceType].forEach(function (storeArray, pointcutName) {
                storeArray.forEach(function (config) {
                    if (config.target === proxy.name) {
                        var id_1 = proxy.addAdvice(pointcutName, adviceType, {
                            injector: injector,
                            config: config
                        });
                        disposers.push(function () { return (proxy.removeAdvice(pointcutName, adviceType, id_1)); });
                    }
                });
            });
        });
        return function () {
            disposers.forEach(function (disposer) { return disposer(); });
        };
    };
    Aspect.prototype.before = function (targetName, pointcutName) {
        return function (target, adviceName) {
            target[adviceName][Aspect.AdviceMark] = {
                type: Aspect.BeforeAdviceMark,
                target: targetName,
                pointcut: pointcutName,
                advice: adviceName
            };
        };
    };
    Aspect.prototype.after = function (targetName, pointcutName) {
        return function (target, adviceName) {
            target[adviceName][Aspect.AdviceMark] = {
                type: Aspect.AfterAdviceMark,
                target: targetName,
                pointcut: pointcutName,
                advice: adviceName
            };
        };
    };
    Aspect.prototype.intercept = function (targetName, pointcutName) {
        return function (target, adviceName) {
            target[adviceName][Aspect.AdviceMark] = {
                type: Aspect.InterceptAdviceMark,
                target: targetName,
                pointcut: pointcutName,
                advice: adviceName
            };
        };
    };
    Aspect.PointcutMark = "PointcutMark";
    Aspect.AdviceMark = "AdviceMark";
    Aspect.BeforeAdviceMark = "Before";
    Aspect.AfterAdviceMark = "After";
    Aspect.InterceptAdviceMark = "Intercept";
    Aspect.AspectTarget = "__$$AspectTarget";
    Aspect.AspectAdvice = "__$$AspectAdvice";
    return Aspect;
}());
exports.Aspect = Aspect;
exports.default = Aspect.getInstance();
//# sourceMappingURL=Aspect.js.map