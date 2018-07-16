"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExecuteContext {
    constructor() {
        this._state = {};
    }
    get state() {
        return this._state;
    }
    getState(key) {
        return this._state[key];
    }
    setState(key, value, readonly = false) {
        if (readonly) {
            Object.defineProperty(this._state, key, { value });
        }
        else {
            this._state[key] = value;
        }
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
    /**
     * if state is a object, assign to context.state.
     * otherwise assign to context.state.value.
     *
     * @template R
     * @param {object} [state=undefined]
     * @returns {Promise<R>}
     * @memberof App
     */
    run(state = undefined) {
        const context = new ExecuteContext();
        if (state !== undefined) {
            if (typeof state === 'object') {
                Object.assign(context.state, state);
            }
            else {
                context.setState('value', state);
            }
        }
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
function autonext(callback) {
    return async (c, n) => {
        await callback(c);
        await n();
    };
}
exports.autonext = autonext;
