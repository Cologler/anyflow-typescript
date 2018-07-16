import { stat } from "fs";

export interface FlowContext {

    /**
     * use for transfer data between middlewares.
     *
     * for symbol key: TypeScript does not support symbol yet.
     * use `getState()` and `setState()`.
     *
     * @type {object}
     * @memberof FlowContext
     */
    readonly state: {
        [name: string]: any,
        [name: number]: any,
        // [name: symbol]: any, // TODO: ts does not support symbol yet. use `getState()` and `setState()`.
    };

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
}

class ExecuteContext implements FlowContext {
    private _state: object = {};

    get state() {
        return this._state;
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

export type MiddlewareFunction = (context: FlowContext, next: Next) => Promise<any>;

export interface Middleware {
    invoke(context: FlowContext, next: Next): Promise<any>;
}

export interface MiddlewareFactory {
    get(): Middleware;
}

class MiddlewareInvoker {
    private _index: number = 0;

    constructor(
        private _factorys: MiddlewareFactory[],
        private _context: FlowContext) {
    }

    next(): Promise<any> {
        if (this._index === this._factorys.length) {
            return Promise.resolve(undefined);
        }

        // create next
        let nextPromist = null;
        const next: Next = async () => {
            nextPromist = nextPromist || this.next();
            return nextPromist;
        };

        const factory = this._factorys[this._index++];
        const middleware = factory.get();
        return middleware.invoke(this._context, next);
    }
}

function middlewareify(obj: Middleware | MiddlewareFunction): Middleware {
    if (typeof obj === 'function') {
        return {
            invoke: obj
        };
    } else {
        return obj;
    }
}

export class App {
    private _factorys: MiddlewareFactory[];

    constructor() {
        this._factorys = [];
    }

    use(obj: Middleware | MiddlewareFunction): this {
        let middleware = middlewareify(obj);
        let factory = {
            get: () => middleware
        };
        this._factorys.push(factory);
        return this;
    }

    useFactory(factory: MiddlewareFactory): this {
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

namespace Middlewares {

    export class AorB implements Middleware {
        constructor(
            private _condition: (c: FlowContext) => boolean,
            private _a: Middleware,
            private _b: Middleware) {
        }

        invoke(context: FlowContext, next: Next): Promise<any> {
            if (this._condition(context)) {
                return this._a.invoke(context, next);
            } else {
                return this._b.invoke(context, next);
            }
        }
    }
}

export function aorb(condition: (c: FlowContext) => boolean,
    a: Middleware | MiddlewareFunction,
    b: Middleware | MiddlewareFunction): Middleware {

    return new Middlewares.AorB(
        condition,
        middlewareify(a),
        middlewareify(b));
}

export function autonext(callback: (context: FlowContext) => Promise<any>): MiddlewareFunction {
    return async (c, n) => {
        await callback(c);
        await n();
    }
}
