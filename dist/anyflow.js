"use strict";
/* Copyright (c) 2018~2999 - Cologler <skyoflw@gmail.com> */
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
    constructor(_factorys, _context, _next = null) {
        this._factorys = _factorys;
        this._context = _context;
        this._next = _next;
    }
    invoke(index = 0) {
        if (index === this._factorys.length) {
            return Promise.resolve(undefined);
        }
        let next = this.getNext(index);
        this._context.hasNext = index + 1 !== this._factorys.length;
        if (!this._context.hasNext && this._next) {
            this._context.hasNext = true;
            next = this._next;
        }
        const factory = this._factorys[index];
        const middleware = factory.get();
        return middleware.invoke(this._context, next);
    }
    getNext(index) {
        // create next
        // middleware.invoke() maybe return null/undefined,
        // so I use array to ensure `nextPromise || ?` only call once work.
        let nextPromise = null;
        const next = () => {
            nextPromise = nextPromise || [this.invoke(index + 1)];
            return nextPromise[0];
        };
        return next;
    }
}
function toMiddleware(obj) {
    if (obj === null) {
        return null;
    }
    if (typeof obj === 'function') {
        return {
            invoke: obj,
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
        const middleware = toMiddleware(obj);
        const factory = {
            get: () => middleware,
        };
        this._factorys.push(factory);
        return this;
    }
    useFactory(factory) {
        this._factorys.push(factory);
        return this;
    }
    branch(condition) {
        if (typeof condition !== 'function') {
            throw new Error('condition must be a function.');
        }
        const m = new Branch(condition);
        this.use(m);
        return m;
    }
    flow() {
        return new Flow(this);
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
    run(state) {
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
        return invoker.invoke();
    }
}
exports.App = App;
class BranchBuilder extends App {
    _execute(context, next) {
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context, next);
        return invoker.invoke();
    }
}
class Branch extends BranchBuilder {
    constructor(_condition) {
        super();
        this._condition = _condition;
        this._else = null;
    }
    invoke(context, next) {
        if (this._condition(context)) {
            return this._execute(context, next);
        }
        else if (this._else) {
            return this._else.invoke(context, next);
        }
        else {
            return next();
        }
    }
    else() {
        if (this._else === null) {
            this._else = new Else(this);
        }
        return this._else;
    }
}
class Else extends BranchBuilder {
    constructor(_else) {
        super();
        this._else = _else;
    }
    invoke(context, next) {
        return this._execute(context, next);
    }
    else() {
        return this._else;
    }
}
class Flow {
    constructor(_baseAppBuilder) {
        this._baseAppBuilder = _baseAppBuilder;
    }
    use(obj) {
        if (typeof obj === 'function') {
            const func = async (context, next) => {
                const ret = await obj(context);
                return context.hasNext ? await next() : ret;
            };
            this._baseAppBuilder.use(func);
        }
        else {
            const middleware = this._toMiddleware(obj);
            this._baseAppBuilder.use(middleware);
        }
        return this;
    }
    useFactory(factory) {
        const wrapper = {
            get: () => {
                return this._toMiddleware(factory.get());
            },
        };
        this._baseAppBuilder.useFactory(wrapper);
        return this;
    }
    _toMiddleware(obj) {
        const middleware = {
            invoke: async (context, next) => {
                const ret = await obj.invoke(context);
                return context.hasNext ? await next() : ret;
            },
        };
        return middleware;
    }
}
