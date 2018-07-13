"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExecuteContext {
    constructor(value) {
        this._state = {};
        this._value = value;
    }
    /**
     * use for transfer data between middlewares.
     *
     * @readonly
     * @memberof ExecuteContext
     */
    get state() {
        return this._state;
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
