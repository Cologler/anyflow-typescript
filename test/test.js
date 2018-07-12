const assert = require('assert');
const { App } = require('../dist/anyflow');

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

    describe('#invoke()', function() {
        it('should call middleware', function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                a = 2;
                await n();
            });
            app.run();
            assert.equal(a, 2);
        });

        it('should call middleware each', function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                a += 2;
                await n();
            });
            app.use(async (c, n) => {
                a += 3;
                await n();
            });
            app.run();
            assert.equal(a, 6);
        });

        it('should call middleware one by one', function() {
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
            app.run();
            assert.equal(a, 3);
        });

        it('should can not call next middleware', function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                a = 2;
                // await n(); not call next
            });
            app.use(async (c, n) => {
                a = 3;
                await n();
            });
            app.run();
            assert.equal(a, 2);
        });

        it('should has return value', async function() {
            const app = new App();
            app.use(async (c, n) => {
                return 3;
            });
            app.use(async (c, n) => {
                return 4;
            });
            assert.equal(await app.run(), 3);
        });

        it('should has return one by one', async function() {
            const app = new App();
            app.use(async (c, n) => {
                return await n();
            });
            app.use(async (c, n) => {
                return 4;
            });
            assert.equal(await app.run(), 4);
        });

        it('should only call once', async function() {
            const app = new App();
            let a = 1;
            app.use(async (c, n) => {
                await n();
                await n();
                await n();
            });
            app.use(async (c, n) => {
                a ++;
            });
            await app.run();
            assert.equal(a, 2);
        });
    });
});
