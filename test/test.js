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

        it('should not throw error when app is empty.', async function() {
            const app = new App();
            assert.equal(await app.run(), undefined);
        });

        it('should invoke middleware by call #run()', async function() {
            const app = new App();
            let a = 1;
            app.use(async () => {
                a = 2;
            });
            await app.run();
            assert.equal(a, 2);
        });

        it('should invoke next middleware by call `await next()`', function() {
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

        it('should invoke middleware one by one', async function() {
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

        it('should invoke only once by call `await next()`', async function() {
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
    });

    describe('#run()~args', function() {
        it('should can pass state by app.run()', async function() {
            const app = new App();
            app.use(async (c, n) => {
                assert.equal(c.state.a, 1);
            });
            await app.run({ a: 1 });
        });

        it('should can get state from Context.state', async function() {
            const app = new App();
            app.use(async (c, n) => {
                assert.equal(c.state.a, 1);
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
            await app.run({ a: 1 });
        });
    });

    describe('#run()~next', function() {
        it('should has property isNone.', async function() {
            const app = new App();
            app.use(async (c, n) => {
                assert.equal(c.hasNext, true);
                await n();
            });
            app.use(async (c, n) => {
                assert.equal(c.hasNext, true);
                await n();
            });
            app.use(async (c, n) => {
                assert.equal(c.hasNext, false);
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

    describe('branch', function() {

        it('should can switch by condition.', async function() {
            const app = new App();
            const b = app.branch(c => c.state.value === 1);
            b.use(async (c, n) => {
                assert.equal(c.state.value, 1);
                return 5;
            });
            b.else().use(async (c, n) => {
                assert.equal(c.state.value, 2);
                return 6;
            });
            assert.strictEqual(await app.run(1), 5);
            assert.strictEqual(await app.run(2), 6);
        });

        it('should has same else()', async function() {
            const app = new App();

            const b1 = app.branch(c => true);
            assert.strictEqual(b1.else(), b1.else());
            assert.strictEqual(b1.else().else(), b1);

            const b2 = app.branch(c => false);
            assert.strictEqual(b2.else(), b2.else());
            assert.strictEqual(b2.else().else(), b2);
        });

        it('should can add branches', async function() {
            const app = new App();
            let value1 = 1;
            let value2 = 1;
            let b = app.branch(c => true);
            b.use((c, n) => {
                value1 = 2;
                return n();
            });
            b.use((c, n) => {
                value2 = 3;
                return n();
            });
            b.else().use((c, n) => {
                assert.fail('should not go here.');
                return n();
            });
            await app.run(1);
            assert.strictEqual(value1, 2);
            assert.strictEqual(value2, 3);
        });

        it('should not call when false', async function() {
            const app = new App();
            let value = 1;
            let b = app.branch(c => false);
            b.use((c, n) => {
                assert.fail('should not go here.');
                return n();
            });
            b.use((c, n) => {
                assert.fail('should not go here.');
                return n();
            });
            b.else().use((c, n) => {
                value = 2;
                return n();
            });
            await app.run(1);
            assert.strictEqual(value, 2);
        });

        it('should not call when false', async function() {
            const app = new App();
            const data = {};
            let order = 0;
            app.use((c, n) => {
                data.m1 = order++;
                return n();
            });
            app.use((c, n) => {
                data.m2 = order++;
                return n();
            });
            const b1 = app.branch(c => true);
            b1.use((c, n) => {
                data.b1m1 = order++;
                return n();
            });
            b1.use((c, n) => {
                data.b1m2 = order++;
                return n();
            });
            const b2 = app.branch(c => false);
            b2.use((c, n) => {
                assert.fail('should not go here.');
                return n();
            });
            b2.use((c, n) => {
                assert.fail('should not go here.');
                return n();
            });
            app.use((c, n) => {
                data.m3 = order++;
                return n();
            });
            app.use((c, n) => {
                data.m4 = order++;
                return n();
            });
            await app.run();
            assert.deepStrictEqual(data, {
                m1: 0,
                m2: 1,
                b1m1: 2,
                b1m2: 3,
                m3: 4,
                m4: 5,
            });
        });
    });
});
