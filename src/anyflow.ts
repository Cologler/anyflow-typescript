export interface FlowContext<T> {

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
     * data input from App.run(value)
     *
     * @type {T}
     * @memberof FlowContext
     */
    readonly value: T;

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
    setState(name: PropertyKey, value: any): void;
}

class ExecuteContext<T> implements FlowContext<T> {
    private _value: T;
    private _state: object = {};

    constructor(value: T) {
        this._value = value;
    }

    get state() {
        return this._state;
    }

    get value() {
        return this._value;
    }

    getState<TS>(key: PropertyKey) {
        return this._state[key] as TS;
    }

    setState(key: PropertyKey, value: any): void {
        return this._state[key] = value;
    }
}

export type Next = () => Promise<any>;

export type MiddlewareFunction<T> = (context: FlowContext<T>, next: Next) => Promise<any>;

export interface Middleware<T> {
    invoke(context: FlowContext<T>, next: Next): Promise<any>;
}

export interface MiddlewareFactory<T> {
    get(): Middleware<T>;
}

class MiddlewareInvoker<T> {
    private _index: number = 0;

    constructor(
        private _factorys: MiddlewareFactory<T>[],
        private _context: FlowContext<T>) {
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

export class App<T> {
    private _factorys: MiddlewareFactory<T>[];

    constructor() {
        this._factorys = [];
    }

    use(obj: Middleware<T> | MiddlewareFunction<T>): this {
        let factory: MiddlewareFactory<T> = null;
        if (typeof obj === 'function') {
            let middleware: Middleware<T> = {
                invoke: obj
            };
            factory = {
                get: () => middleware
            };
        } else if (typeof obj === 'object') {
            factory = {
                get: () => obj
            };
        }
        if (factory) {
            this._factorys.push(factory);
        }
        return this;
    }

    useFactory(factory: MiddlewareFactory<T>): this {
        this._factorys.push(factory);
        return this;
    }

    run<R>(value: T): Promise<R> {
        const context = new ExecuteContext<T>(value);
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.next();
    }
}
