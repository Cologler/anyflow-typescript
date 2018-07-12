interface ExecuteContext {
    readonly data: object;
}
declare type Next = () => Promise<any>;
declare type MiddlewareFunction = (context: ExecuteContext, next: Next) => Promise<any>;
interface Middleware {
    invoke: MiddlewareFunction;
}
interface MiddlewareFactory {
    get(): Middleware;
}
export declare class App {
    private _factorys;
    constructor();
    use(obj: Middleware | MiddlewareFunction): this;
    useFactory(factory: MiddlewareFactory): this;
    run(value: any): Promise<any>;
}
export {};
