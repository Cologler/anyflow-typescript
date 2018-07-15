(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.anyflow = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExecuteContext {
    constructor(value) {
        this._state = {};
        this._value = value;
    }
    get state() {
        return this._state;
    }
    get value() {
        return this._value;
    }
    getState(key) {
        return this._state[key];
    }
    setState(key, value) {
        return this._state[key] = value;
    }
}
class MiddlewareInvoker {
    constructor(_factorys, _context) {
        this._factorys = _factorys;
        this._context = _context;
        this._index = 0;
    }
    next() {
        if (this._index === this._factorys.length) {
            return Promise.resolve(undefined);
        }
        // create next
        let nextPromist = null;
        const next = async () => {
            nextPromist = nextPromist || this.next();
            return nextPromist;
        };
        const factory = this._factorys[this._index++];
        const middleware = factory.get();
        return middleware.invoke(this._context, next);
    }
}
function middlewareify(obj) {
    if (typeof obj === 'function') {
        return {
            invoke: obj
        };
    }
    else {
        return obj;
    }
}
class App {
    constructor() {
        this._factorys = [];
    }
    use(obj) {
        let middleware = middlewareify(obj);
        let factory = {
            get: () => middleware
        };
        this._factorys.push(factory);
        return this;
    }
    useFactory(factory) {
        this._factorys.push(factory);
        return this;
    }
    run(value) {
        const context = new ExecuteContext(value);
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.next();
    }
}
exports.App = App;
var Middlewares;
(function (Middlewares) {
    class AorB {
        constructor(_condition, _a, _b) {
            this._condition = _condition;
            this._a = _a;
            this._b = _b;
        }
        invoke(context, next) {
            if (this._condition(context)) {
                return this._a.invoke(context, next);
            }
            else {
                return this._b.invoke(context, next);
            }
        }
    }
    Middlewares.AorB = AorB;
})(Middlewares || (Middlewares = {}));
function aorb(condition, a, b) {
    return new Middlewares.AorB(condition, middlewareify(a), middlewareify(b));
}
exports.aorb = aorb;

},{}]},{},[1])(1)
});
