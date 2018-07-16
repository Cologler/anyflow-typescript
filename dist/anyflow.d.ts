export interface FlowContext {
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
export declare type MiddlewareFunction = (context: FlowContext, next: Next) => Promise<any>;
export interface Middleware {
    invoke(context: FlowContext, next: Next): Promise<any>;
}
export interface MiddlewareFactory {
    get(): Middleware;
}
export declare class App {
    private _factorys;
    constructor();
    use(obj: Middleware | MiddlewareFunction): this;
    useFactory(factory: MiddlewareFactory): this;
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
export declare function aorb(condition: (c: FlowContext) => boolean, a: Middleware | MiddlewareFunction, b: Middleware | MiddlewareFunction): Middleware;
export declare function autonext(callback: (context: FlowContext) => Promise<any>): MiddlewareFunction;
