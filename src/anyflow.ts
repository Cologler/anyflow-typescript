class ExecuteContext {
    readonly data = {};
}

type Next = () => Promise<any>;

type MiddlewareFunction<Context extends ExecuteContext> = (context: Context, next: Next) => Promise<any>;

interface Middleware<Context extends ExecuteContext> {
    invoke: MiddlewareFunction<Context>;
}

interface MiddlewareFactory<Context extends ExecuteContext> {
    get(): Middleware<Context>;
}

class MiddlewareInvoker<Context extends ExecuteContext> {
    private _factorys: MiddlewareFactory<Context>[];
    private _context: Context;
    private _index: number = 0;

    constructor(factorys: MiddlewareFactory<Context>[], context: Context) {
        this._factorys = factorys;
        this._context = context;
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

export class GenericApp<Context extends ExecuteContext> {
    private _factorys: MiddlewareFactory<Context>[];

    constructor() {
        this._factorys = [];
    }

    use(obj: MiddlewareFactory<Context> | MiddlewareFunction<Context>): this {
        let factory: MiddlewareFactory<Context> = null;
        if (typeof obj === 'function') {
            let middleware: Middleware<Context> = {
                invoke: obj
            };
            factory = {
                get: () => middleware
            };
        } else if (typeof obj === 'object') {
            factory = obj;
        }
        if (factory) {
            this._factorys.push(factory);
        }
        return this;
    }

    run(context: Context): Promise<any> {
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.next();
    }
}

export class App extends GenericApp<ExecuteContext> {
    run(context: ExecuteContext = null): Promise<any> {
        context = context || new ExecuteContext();
        return super.run(context);
    }
}
