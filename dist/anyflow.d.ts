declare class ExecuteContext<T> {
    private _value;
    private _state;
    constructor(value: T);
    /**
     * use for transfer data between middlewares.
     *
     * @readonly
     * @memberof ExecuteContext
     */
    readonly state: object;
    /**
     * data input from App.run(value)
     *
     * @readonly
     * @memberof ExecuteContext
     */
    readonly value: T;
}
declare type Next = () => Promise<any>;
declare type MiddlewareFunction<T> = (context: ExecuteContext<T>, next: Next) => Promise<any>;
interface Middleware<T> {
    invoke: MiddlewareFunction<T>;
}
interface MiddlewareFactory<T> {
    get(): Middleware<T>;
}
export declare class App<T> {
    private _factorys;
    constructor();
    use(obj: Middleware<T> | MiddlewareFunction<T>): this;
    useFactory(factory: MiddlewareFactory<T>): this;
    run(value: T): Promise<any>;
}
export {};
