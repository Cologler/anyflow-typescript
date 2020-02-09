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
     * return whether the next middleware is a empty middleware.
     *
     * @type {boolean}
     * @memberof FlowContext
     */
    readonly hasNext: boolean;
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
declare type MiddlewareType<T extends object> = Middleware<T> | MiddlewareFunction<T>;
export interface MiddlewareFactory<T extends object> {
    get(ctx: FlowContext<T>): Middleware<T>;
}
export interface IFlowAppBuilder<T extends object> {
    use(obj: {
        invoke(context: FlowContext<T>): Promise<any>;
    } | ((context: FlowContext<T>) => Promise<any>)): this;
    useFactory(factory: {
        get(): {
            invoke(context: FlowContext<T>): Promise<any>;
        };
    }): this;
}
export interface IAppBuilder<T extends object> {
    /**
     * add a function or a middleware instance.
     *
     * @param {MiddlewareType<T>} obj
     * @returns {this}
     * @memberof IAppBuilder
     */
    use(obj: MiddlewareType<T>): this;
    /**
     * add a middleware factory.
     *
     * @param {MiddlewareFactory<T>} factory
     * @returns {this}
     * @memberof IAppBuilder
     */
    useFactory(factory: MiddlewareFactory<T>): this;
    /**
     * use a new `IBranchBuilder` as single middleware.
     *
     * @param {(c: FlowContext<T>) => boolean} condition
     * @returns {IBranchBuilder<T>} the new `IBranchBuilder`
     * @memberof IAppBuilder
     */
    branch(condition: (c: FlowContext<T>) => boolean): IBranchBuilder<T>;
    /**
     * get a `IFlowAppBuilder` for this `IAppBuilder`.
     *
     * `IFlowAppBuilder` is not a middleware.
     *
     * @returns {IFlowAppBuilder<T>}
     * @memberof IAppBuilder
     */
    flow(): IFlowAppBuilder<T>;
}
export interface IBranchBuilder<T extends object> extends IAppBuilder<T> {
    else(): IBranchBuilder<T>;
}
export declare class App<T extends object> implements IAppBuilder<T> {
    protected _factorys: Array<MiddlewareFactory<T>>;
    constructor();
    use(obj: MiddlewareType<T>): this;
    useFactory(factory: MiddlewareFactory<T>): this;
    branch(condition: (c: FlowContext<T>) => boolean): IBranchBuilder<T>;
    flow(): IFlowAppBuilder<T>;
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
export {};
