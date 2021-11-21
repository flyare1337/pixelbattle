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
    handler(req, res) {
        r.db('pixelbattle').table('users').get(req.body.token).run(r.connection, async (err, user) => {
            if (err) throw err;
            return res.send(user);
        });
    }
});