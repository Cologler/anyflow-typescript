declare class ExecuteContext {
    readonly data: {};
}
declare type Next = () => Promise<any>;
declare type MiddlewareFunction<Context extends ExecuteContext> = (context: Context, next: Next) => Promise<any>;
interface Middleware<Context extends ExecuteContext> {
    invoke: MiddlewareFunction<Context>;
}
interface MiddlewareFactory<Context extends ExecuteContext> {
    get(): Middleware<Context>;
}
export declare class GenericApp<Context extends ExecuteContext> {
    private _factorys;
    constructor();
    use(obj: MiddlewareFactory<Context> | MiddlewareFunction<Context>): this;
    run(context: Context): Promise<any>;
}
export declare class App extends GenericApp<ExecuteContext> {
    run(context?: ExecuteContext): Promise<any>;
}
export {};
