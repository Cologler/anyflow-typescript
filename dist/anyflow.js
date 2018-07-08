"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExecuteContext {
    constructor() {
        this.data = {};
    }
}
class MiddlewareInvoker {
    constructor(factorys, context) {
        this._index = 0;
        this._factorys = factorys;
        this._context = context;
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
class GenericApp {
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
            factory = obj;
        }
        if (factory) {
            this._factorys.push(factory);
        }
        return this;
    }
    run(context) {
        const invoker = new MiddlewareInvoker(this._factorys.slice(), context);
        return invoker.next();
    }
}
exports.GenericApp = GenericApp;
class App extends GenericApp {
    run(context = null) {
        context = context || new ExecuteContext();
        return super.run(context);
    }
}
exports.App = App;
