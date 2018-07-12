# anyflow

**NOT only http server need middleware !!**

## HOW-TO-USE

``` js
const { App } = require('anyflow');
const app = new App();
// use function as middleware
app.use(async (context, next) => {
    // you can get or set data from context.data
    return await next(); // call next middleware
});
// or use middleware
app.use({
    invoke: async (context, next) => {
        return await next();
    }
});
// or use middleware factory
app.useFactory({
    get: () => ({
        // factory allow you make a new middleware for each times.
        invoke: async (context, next) => {
            return await next();
        }
    })
});
// then run middleware chain.
app.run();
```

## reference

* Asp.Net Core middleware
