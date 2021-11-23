const { on } = require('events');

module.exports = (r, ee) => ({
    method: "GET",
    url: '/pixels/sse',
    schema: {},
    config: {
        rateLimit: {
            max: 3,
            timeWindow: '1s'
        }
    },
    handler(req, res) {
        res.sse(
            (async function* () {
                for await (const [data] of on(ee, 'place')) {
                    yield { data: JSON.stringify(data) };
                }
            })()
        );
    }
});