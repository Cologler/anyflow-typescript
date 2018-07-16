export interface FlowContext<T extends object> {
    /**
     * use for transfer data between middlewares.
     *
     * for symbol key: TypeScript does not support symbol yet.
     * use `getState()` and `setState()`.
     *
     * @type {object}
     * @memberof FlowContext
     */
    readonly state: T;
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
    setState(name: PropertyKey, value: any, readonly?: boolean): void;
}
export declare type Next = () => Promise<any>;
export declare type MiddlewareFunction<T extends object> = (context: FlowContext<T>, next: Next) => Promise<any>;
export interface Middleware<T extends object> {
    invoke(context: FlowContext<T>, next: Next): Promise<any>;
}
export interface MiddlewareFactory<T extends object> {
    get(): Middleware<T>;
}
export declare class App<T extends object> {
    private _factorys;
    constructor();
    use(obj: Middleware<T> | MiddlewareFunction<T>): this;
    useFactory(factory: MiddlewareFactory<T>): this;
    /**
     * if state is a object, assign to context.state.
     * otherwise assign to context.state.value.
     *
     * @template R
     * @param {object} [state=undefined]
     * @returns {Promise<R>}
     * @memberof App
     */
    run<R>(state?: object): Promise<R>;
}
export declare function aorb<T extends object>(condition: (c: FlowContext<T>) => boolean, a: Middleware<T> | MiddlewareFunction<T>, b: Middleware<T> | MiddlewareFunction<T>): Middleware<T>;
export declare function autonext<T extends object>(callback: (context: FlowContext<T>) => Promise<any>): MiddlewareFunction<T>;
