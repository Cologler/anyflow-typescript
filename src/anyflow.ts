class ExecuteContext<T> {
    private _value: T;
    private _state: object = {};

    constructor(value: T) {
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

type Next = () => Promise<any>;

type MiddlewareFunction<T> = (context: ExecuteContext<T>, next: Next) => Promise<any>;

interface Middleware<T> {
    invoke: MiddlewareFunction<T>;
}

interface MiddlewareFactory<T> {
    get(): Middleware<T>;
}

class MiddlewareInvoker<T> {
    private _factorys: MiddlewareFactory<T>[];
    private _context: ExecuteContext<T>;
    private _index: number = 0;

    constructor(factorys: MiddlewareFactory<T>[], ExecuteContext: ExecuteContext<T>) {
        this._factorys = factorys;
        this._context = ExecuteContext;
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

    run(value: T): Promise<any> {
        const context = new ExecuteContext<T>(value);
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.next();
    }
}
