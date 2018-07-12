interface ExecuteContext {
    readonly data: object;
}

type Next = () => Promise<any>;

type MiddlewareFunction = (context: ExecuteContext, next: Next) => Promise<any>;

interface Middleware {
    invoke: MiddlewareFunction;
}

interface MiddlewareFactory {
    get(): Middleware;
}

class MiddlewareInvoker {
    private _factorys: MiddlewareFactory[];
    private _context: ExecuteContext;
    private _index: number = 0;

    constructor(factorys: MiddlewareFactory[], ExecuteContext: ExecuteContext) {
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

export class App {
    private _factorys: MiddlewareFactory[];

    constructor() {
        this._factorys = [];
    }

    use(obj: Middleware | MiddlewareFunction): this {
        let factory: MiddlewareFactory = null;
        if (typeof obj === 'function') {
            let middleware: Middleware = {
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

    useFactory(factory: MiddlewareFactory): this {
        this._factorys.push(factory);
        return this;
    }

    run(value: any): Promise<any> {
        const context: ExecuteContext = {
            data: {}
        };
        Object.defineProperty(context, 'data', {
            value: {}
        });
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.next();
    }
}
