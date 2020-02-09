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
     * return whether the next middleware is a empty middleware.
     *
     * @type {boolean}
     * @memberof FlowContext
     */
    readonly hasNext: boolean;

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

class FlowContextImpl<T extends object> implements FlowContext<T> {
    public hasNext: boolean;
    private _state: object = {};

    get state() {
        return this._state as T;
    }

    public getState<TS>(key: PropertyKey) {
        return this._state[key] as TS;
    }

    public setState(key: PropertyKey, value: any, readonly: boolean = false): void {
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
    get(ctx: FlowContext<T>): Middleware<T>;
}

class MiddlewareInvoker<T extends object> {
    constructor(
        private _factorys: Array<MiddlewareFactory<T>>,
        private _context: FlowContextImpl<T>) {
    }

    public invoke(index = 0): Promise<any> {
        if (index === this._factorys.length) {
            return Promise.resolve(undefined);
        }

        let next = this.getNext(index);
        this._context.hasNext = index + 1 < this._factorys.length;

        const factory = this._factorys[index];
        const middleware = factory.get(this._context);
        return middleware.invoke(this._context, next);
    }

    private getNext(index): Next {
        // create next
        // middleware.invoke() maybe return null/undefined,
        // so I use array to ensure `nextPromise || ?` only call once work.
        let nextPromise: [Promise<any>] = null;
        const next: Next = () => {
            nextPromise = nextPromise || [this.invoke(index + 1)];
            return nextPromise[0];
        };
        return next;
    }
}

function toMiddleware<T extends object>(obj: MiddlewareType<T>): Middleware<T> {
    if (obj === null) {
        return null;
    }

    if (typeof obj === 'function') {
        return {
            invoke: obj,
        };
    } else {
        return obj;
    }
}

export interface IFlowAppBuilder<T extends object> {
    use(obj: {invoke(context: FlowContext<T>): Promise<any>}|((context: FlowContext<T>) => Promise<any>)): this;
    useFactory(factory: {get(): {invoke(context: FlowContext<T>): Promise<any>}}): this;
}

export interface IAppBuilder<T extends object> {
    /**
     * add a function or a middleware instance.
     *
     * @param {MiddlewareType<T>} obj
     * @returns {this}
     * @memberof IAppBuilder
     */
    use(obj: MiddlewareType<T>): this;

    /**
     * add a middleware factory.
     *
     * @param {MiddlewareFactory<T>} factory
     * @returns {this}
     * @memberof IAppBuilder
     */
    useFactory(factory: MiddlewareFactory<T>): this;

    /**
     * use a new `IBranchBuilder` as single middleware.
     *
     * @param {(c: FlowContext<T>) => boolean} condition
     * @returns {IBranchBuilder<T>} the new `IBranchBuilder`
     * @memberof IAppBuilder
     */
    branch(condition: (c: FlowContext<T>) => boolean): IBranchBuilder<T>;

    /**
     * get a `IFlowAppBuilder` for this `IAppBuilder`.
     *
     * `IFlowAppBuilder` is not a middleware.
     *
     * @returns {IFlowAppBuilder<T>}
     * @memberof IAppBuilder
     */
    flow(): IFlowAppBuilder<T>;
}

export interface IBranchBuilder<T extends object> extends IAppBuilder<T> {
    else(): IBranchBuilder<T>;
}

export class App<T extends object> implements IAppBuilder<T> {
    protected _factorys: Array<MiddlewareFactory<T>>;

    constructor() {
        this._factorys = [];
    }

    public use(obj: MiddlewareType<T>): this {
        const middleware = toMiddleware(obj);
        const factory = {
            get: () => middleware,
        };
        this._factorys.push(factory);
        return this;
    }

    public useFactory(factory: MiddlewareFactory<T>): this {
        this._factorys.push(factory);
        return this;
    }

    public branch(condition: (c: FlowContext<T>) => boolean): IBranchBuilder<T> {
        if (typeof condition !== 'function') {
            throw new Error('condition must be a function.');
        }
        const m = new Branch<T>(condition);
        this.use(m);
        return m;
    }

    public flow(): IFlowAppBuilder<T> {
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
    public run<R>(state?: object): Promise<R> {
        const context = new FlowContextImpl();
        if (state !== undefined) {
            if (typeof state === 'object') {
                Object.assign(context.state, state);
            } else {
                context.setState('value', state);
            }
        }
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.invoke();
    }
}

abstract class BranchBuilder<T extends object> extends App<T> implements Middleware<T>, IBranchBuilder<T> {
    public abstract invoke(context: FlowContext<T>, next: Next);
    public abstract else();

    protected _execute(context: FlowContext<T>, next: Next) {
        const nextAsMiddleware: MiddlewareFactory<T> = {
            get: () => ({
                invoke: () => next()
            })
        };
        const factorys = this._factorys.slice();
        factorys.push(nextAsMiddleware);
        const invoker = new MiddlewareInvoker(
            factorys,
            context as FlowContextImpl<T>);
        return invoker.invoke();
    }
}

class Branch<T extends object> extends BranchBuilder<T> {
    private _else: Else<T> = null;

    constructor(private _condition: (c: FlowContext<T>) => boolean | null) {
        super();
    }

    public invoke(context: FlowContext<T>, next: Next): Promise<any> {
        if (this._condition(context)) {
            return this._execute(context, next);
        } else if (this._else) {
            return this._else.invoke(context, next);
        } else {
            return next();
        }
    }

    public else(): IBranchBuilder<T> {
        if (this._else === null) {
            this._else = new Else<T>(this);
        }
        return this._else;
    }
}

class Else<T extends object> extends BranchBuilder<T> {
    constructor(private _else: Branch<T>) {
        super();
    }

    public invoke(context: FlowContext<T>, next: Next) {
        return this._execute(context, next);
    }

    public else(): IBranchBuilder<T> {
        return this._else;
    }
}

class Flow<T extends object> implements IFlowAppBuilder<T> {
    constructor(private _baseAppBuilder: IAppBuilder<T>) {
    }

    public use(obj: {
        invoke(context: FlowContext<T>): Promise<any>;
    } | ((context: FlowContext<T>) => Promise<any>)): this {
        if (typeof obj === 'function') {
            const func: MiddlewareFunction<T> = async (context, next) => {
                const ret = await obj(context);
                return context.hasNext ? await next() : ret;
            };
            this._baseAppBuilder.use(func);
        } else {
            const middleware: Middleware<T> = this._toMiddleware(obj);
            this._baseAppBuilder.use(middleware);
        }
        return this;
    }

    public useFactory(factory: { get(): { invoke(context: FlowContext<T>): Promise<any>; }; }): this {
        const wrapper: MiddlewareFactory<T> = {
            get: () => {
                return this._toMiddleware(factory.get());
            },
        };
        this._baseAppBuilder.useFactory(wrapper);
        return this;
    }

    private _toMiddleware(obj: { invoke(context: FlowContext<T>): Promise<any>; }) {
        const middleware: Middleware<T> = {
            invoke: async (context, next) => {
                const ret = await obj.invoke(context);
                return context.hasNext ? await next() : ret;
            },
        };
        return middleware;
    }
}
