const { ended } = require('../config.json');
const { PassThrough } = require('stream');

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
        const read = new PassThrough({ objectMode: true });
        res.sse(read);

        read.write({ op: 'HELLO' });
        if (ended) read.write({ op: 'ENDED', value: true });
        ee.on('place', data => read.write(data));
    }
});