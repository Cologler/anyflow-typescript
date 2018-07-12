declare class ExecuteContext {
    private _value;
    private _data;
    constructor(value: any);
    /**
     * use for transfer data between each middleware.
     *
     * @readonly
     * @memberof ExecuteContext
     */
    readonly data: object;
    /**
     * data input from App.run(value)
     *
     * @readonly
     * @memberof ExecuteContext
     */
    readonly value: any;
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
