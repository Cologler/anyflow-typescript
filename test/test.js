const assert = require('assert');
const { App } = require('../dist/anyflow.js');

describe('anyflow', function() {

    describe('#use()', function() {
        it('should can use function middleware', async function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                a = 2;
                return 10;
            });
            assert.equal(await app.run(), 10);
            assert.equal(a, 2);
        });

        it('should can use middleware', async function() {
            const app = new App();
            let a = 1;
            app.use({
                invoke: async (c, n) => {
                    a = 2;
                    return 10;
                }
            });
            assert.equal(await app.run(), 10);
            assert.equal(a, 2);
        });
    });

    describe('#useFactory()', function() {
        it('should can use middleware factory', async function() {
            const app = new App();
            let a = 1;
            app.useFactory({
                get: () => ({
                    invoke: async (c, n) => {
                        a = 2;
                        return 10;
                    }
                })
            });
            assert.equal(await app.run(), 10);
            assert.equal(a, 2);
        });
    });

    describe('#run()', function() {

        it('should call middleware by #run()', async function() {
            const app = new App();
            let a = 1;
            app.use(async () => {
                a = 2;
            });
            await app.run();
            assert.equal(a, 2);
        });

        it('should call next middleware if `await next()`', function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                a += 2;
                await n(); // call next
            });
            app.use(async (c, n) => {
                a += 3;
                // wont call next
            });
            app.use(async (c, n) => {
                a += 4;
            });
            app.run();
            assert.equal(a, 6); // 1 + 2 + 3
        });

        it('should call middleware one by one', async function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                a = 2;
                await n();
            });
            app.use(async (c, n) => {
                a = 3;
                await n();
            });
            await app.run();
            assert.equal(a, 3); // should be last one.
        });

        it('should call only once `await next()`', async function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                assert.equal(await n(), 8);
                assert.equal(await n(), 8);
                assert.equal(await n(), 8);
            });
            app.use(async (c, n) => {
                a ++;
                return 8;
            });
            await app.run();
            assert.equal(a, 2);
        });

        it('should pass argument by Context.value', async function() {
            const app = new App();
            app.use((c) => {
                assert.equal(c.value, 2);
                return 3;
            });
            await app.run(2);
        });

        it('should pass state by Context.state', async function() {
            const app = new App();
            app.use(async (c, n) => {
                assert.equal(c.state.a, undefined);
                c.state.a = 3;
                await n();
            });
            app.use(async (c, n) => {
                assert.equal(c.state.a, 3);
                c.state.a = 5;
                await n();
            });
            app.use(async (c, n) => {
                assert.equal(c.state.a, 5);
                await n();
            });
            await app.run();
        });
    });

    describe('#run()~return', function() {
        it('should accept return value', async function() {
            const app = new App();
            app.use(async (c, n) => {
                return 3;
            });
            assert.equal(await app.run(), 3);
        });

        it('should accept return value by `await next()`', async function() {
            const app = new App();
            app.use(async (c, n) => {
                return await n();
            });
            app.use(async (c, n) => {
                return 4;
            });
            assert.equal(await app.run(), 4);
        });

        it('should accept last `await next()` should be undefined', async function() {
            const app = new App();
            app.use(async (c, n) => {
                return await n();
            });
            app.use(async (c, n) => {
                return await n(); // no next
            });
            assert.equal(await app.run(), undefined);
        });
    });
});
