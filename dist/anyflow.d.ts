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
        [name: string]: any;
        [name: number]: any;
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
export declare type Next = () => Promise<any>;
export declare type MiddlewareFunction<T> = (context: FlowContext<T>, next: Next) => Promise<any>;
export interface Middleware<T> {
    invoke(context: FlowContext<T>, next: Next): Promise<any>;
}
export interface MiddlewareFactory<T> {
    get(): Middleware<T>;
}
export declare class App<T> {
    private _factorys;
    constructor();
    use(obj: Middleware<T> | MiddlewareFunction<T>): this;
    useFactory(factory: MiddlewareFactory<T>): this;
    run<R>(value: T): Promise<R>;
}
export declare function aorb<T>(condition: (c: FlowContext<T>) => boolean, a: Middleware<T> | MiddlewareFunction<T>, b: Middleware<T> | MiddlewareFunction<T>): Middleware<T>;
