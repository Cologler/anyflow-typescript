(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.anyflow = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExecuteContext {
    constructor(value) {
        this._data = {};
        this._value = value;
    }
    /**
     * use for transfer data between each middleware.
     *
     * @readonly
     * @memberof ExecuteContext
     */
    get data() {
        return this._data;
    }
    /**
     * data input from App.run(value)
     *
     * @readonly
     * @memberof ExecuteContext
     */
    get value() {
        return this._value;
    }
}
class MiddlewareInvoker {
    constructor(factorys, ExecuteContext) {
        this._index = 0;
        this._factorys = factorys;
        this._context = ExecuteContext;
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
class App {
    constructor() {
        this._factorys = [];
    }
    use(obj) {
        let factory = null;
        if (typeof obj === 'function') {
            let middleware = {
                invoke: obj
            };
            factory = {
                get: () => middleware
            };
        }
        else if (typeof obj === 'object') {
            factory = {
                get: () => obj
            };
        }
        if (factory) {
            this._factorys.push(factory);
        }
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

},{}]},{},[1])(1)
});
