export interface FlowContext<T> {
    /**
     * use for transfer data between middlewares.
     *
     * @type {object}
     * @memberof FlowContext
     */
    readonly state: object;
    /**
     * data input from App.run(value)
     *
     * @type {T}
     * @memberof FlowContext
     */
    readonly value: T;
}
export declare type Next = () => Promise<any>;
export declare type MiddlewareFunction<T> = (context: FlowContext<T>, next: Next) => Promise<any>;
export interface Middleware<T> {
    invoke: MiddlewareFunction<T>;
}
export interface MiddlewareFactory<T> {
    get(): Middleware<T>;
}
export declare class App<T> {
    private _factorys;
    constructor();
    use(obj: Middleware<T> | MiddlewareFunction<T>): this;
    useFactory(factory: MiddlewareFactory<T>): this;
    run(value: T): Promise<any>;
}
