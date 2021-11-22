const rethinkdb = require('rethinkdb');

module.exports = (r) => ({
    method: "POST",
    url: '/getInfo',
    schema: {
        body: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string' }
            }
        }
    },
    config: {
        rateLimit: {
            max: 3,
            timeWindow: '1s'
        }
    },
    async handler(req, res) {
        const user = await rethinkdb.db('pixelbattle').table('users').get(req.body.token).run(r); // ??
        return res.send(user);
    }
});