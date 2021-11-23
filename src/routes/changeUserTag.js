const rethinkdb = require('rethinkdb');

module.exports = (r) => ({
    method: "POST",
    url: '/user/changeTag',
    schema: {
        body: {
            type: 'object',
            required: ['token', 'tag'],
            properties: {
                token: { type: 'string' },
                tag: { type: 'string', maxLength: 8 }
            }
        }
    },
    config: {
        rateLimit: {
            max: 3,
            timeWindow: '1s'
        }
    },
    async preHandler(req, res, done) {
        const user = await rethinkdb
            .db('pixelbattle')
            .table('users')
            .get(req.body.token)
            .run(r);

        if (!user) return res.send({ error: true, reason: "NotAuthorized" });

        done();
    },
    async handler(req, res) {
        await rethinkdb
            .db('pixelbattle')
            .table('users')
            .get(req.body.token)
            .update({ tag: (!req.body.tag) ? null : req.body.tag })
            .run(r);

        return res.send({ error: false, reason: "Ok" });
    }
});