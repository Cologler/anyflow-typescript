/* Copyright (c) 2018~2999 - Cologler <skyoflw@gmail.com> */

export interface FlowContext<T extends object> {

    /**
     * use for transfer data between middlewares.
     *
     * for symbol key: TypeScript does not support symbol yet.
     * use `getState()` and `setState()`.
     *
     * @type {object}
     * @memberof FlowContext
     */
    readonly state: T;

    /**
     * same as `this.state[name]`.
     *
     * @template TS
     * @param {PropertyKey} name
     * @returns {TS}
     * @memberof FlowContext
     */
    getState<TS>(name: PropertyKey): TS;

    /**
     * same as `this.state[name]=value`.
     *
     * @param {PropertyKey} name
     * @param {*} value
     * @memberof FlowContext
     */
    setState(name: PropertyKey, value: any, readonly?: boolean): void;

    /**
     * return whether the next middleware is a empty middleware.
     *
     * @type {boolean}
     * @memberof FlowContext
     */
    readonly hasNext: boolean;
}

class ExecuteContext<T extends object> implements FlowContext<T> {
    private _state: object = {};
    hasNext: boolean;

    get state() {
        return this._state as T;
    }

    getState<TS>(key: PropertyKey) {
        return this._state[key] as TS;
    }

    setState(key: PropertyKey, value: any, readonly: boolean = false): void {
        if (readonly) {
            Object.defineProperty(this._state, key, { value });
        } else {
            this._state[key] = value;
        }
    }
}

export type Next = () => Promise<any>;

export type MiddlewareFunction<T extends object> = (context: FlowContext<T>, next: Next) => Promise<any>;

export interface Middleware<T extends object> {
    invoke(context: FlowContext<T>, next: Next): Promise<any>;
}

type MiddlewareType<T extends object> = Middleware<T> | MiddlewareFunction<T>;

export interface MiddlewareFactory<T extends object> {
    get(): Middleware<T>;
}

class MiddlewareInvoker<T extends object> {
    constructor(
        private _factorys: MiddlewareFactory<T>[],
        private _context: ExecuteContext<T>,
        private _next: Next = null) {
    }

    getNext(index): Next {
        // create next
        // middleware.invoke() maybe return null/undefined,
        // so I use array to ensure `nextPromise || ?` work only call once.
        let nextPromise: [Promise<any>] = null;
        let next: Next = () => {
            nextPromise = nextPromise || [this.next(index + 1)];
            return nextPromise[0];
        };
        return next;
    }

    next(index = 0): Promise<any> {
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
}

function toMiddleware<T extends object>(obj: MiddlewareType<T>): Middleware<T> {
    if (obj === null) {
        return null;
    }
    if (typeof obj === 'function') {
        return {
            invoke: obj
        };
    } else {
        return obj;
    }
}

interface IAppBuilder<T extends object> {
    use(obj: MiddlewareType<T>): this;
    useFactory(factory: MiddlewareFactory<T>): this;
    branch(condition: (c: FlowContext<T>) => boolean): IAppBuilder<T>;
}

export class App<T extends object> implements IAppBuilder<T> {
    protected _factorys: MiddlewareFactory<T>[];

    constructor() {
        this._factorys = [];
    }

    use(obj: MiddlewareType<T>): this {
        let middleware = toMiddleware(obj);
        let factory = {
            get: () => middleware
        };
        this._factorys.push(factory);
        return this;
    }

    useFactory(factory: MiddlewareFactory<T>): this {
        this._factorys.push(factory);
        return this;
    }

    branch(condition: (c: FlowContext<T>) => boolean): IAppBuilder<T> {
        const m = new Branch<T>(condition);
        this.use(m);
        return m;
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
    run<R>(state: object = undefined): Promise<R> {
        const context = new ExecuteContext();
        if (state !== undefined) {
            if (typeof state === 'object') {
                Object.assign(context.state, state);
            } else {
                context.setState('value', state);
            }
        }
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.next();
    }
}

class Branch<T extends object> extends App<T> implements Middleware<T> {
    constructor(private _condition: (c: FlowContext<T>) => boolean) {
        super();
    }

    invoke(context: FlowContext<T>, next: Next): Promise<any> {
        if (this._condition(context)) {
            const invoker = new MiddlewareInvoker(
                this._factorys.slice(),
                context as ExecuteContext<T>,
                next);
            return invoker.next();
        } else {
            return next();
        }
    }
}

namespace Middlewares {

    export class AorB<T extends object> implements Middleware<T> {
        constructor(
            private _condition: (c: FlowContext<T>) => boolean,
            private _a: Middleware<T>,
            private _b: Middleware<T>) {
        }

        invoke(context: FlowContext<T>, next: Next): Promise<any> {
            if (this._condition(context)) {
                if (this._a) {
                    return this._a.invoke(context, next);
                }
            } else {
                if (this._b) {
                    return this._b.invoke(context, next);
                }
            }
            return next();
        }
    }
}

export function aorb<T extends object>(condition: (c: FlowContext<T>) => boolean,
    a: MiddlewareType<T>,
    b: MiddlewareType<T>): Middleware<T> {

    return new Middlewares.AorB(
        condition,
        toMiddleware(a),
        toMiddleware(b));
}

export function autonext<T extends object>(callback: (context: FlowContext<T>) => Promise<any>)
    : MiddlewareFunction<T> {

    return async (c, n) => {
        await callback(c);
        return await n();
    }
}
