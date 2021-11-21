const { ended } = require('../config.json');
module.exports = (r) => ({
    method: "POST",
    url: '/pixels/upload',
    schema: {
        body: {
            type: 'object',
            required: ['id', 'color'],
            properties: {
                id: { type: 'number' },
                color: { type: 'string' },
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
    preHandler(req, res, done) {
        r.db('pixelbattle').table('users').get(req.body.token).run(r.connection, async (err, user) => {
            if (err) throw err;
            if (!user) return res.send({ error: true, reason: "NotAuthorized" });
            if (ended) return res.send({ error: true, reason: "Ended" });
            if (user.cooldown > Date.now()) return res.send({ error: true, reason: "UserCooldown", cooldown: Math.round((user.cooldown - Date.now()) / 1000) });

            done();
        });
    },
    handler(req, res) {
        let isHex = /^#[0-9A-F]{6}$/i;
        if (!isHex.test(req.body.color)) return res.send({ error: true, reason: "IncorrectColor" });

        r.db('pixelbattle').table('pixels').get(req.body.id).run(r.connection, async (err, pixel) => {
            if (err) throw err;
            if (!pixel) return res.send({ error: true, reason: "IncorrectPixel" });

            r.db('pixelbattle').table('users').get(req.body.token).update({ cooldown: Date.now() + 60000 })
                .run(r.connection, async (err) => {
                    if (err) throw err;
                    r.db('pixelbattle').table('pixels').get(req.body.id)
                        .update({ color: req.body.color }).run(r.connection, async (err) => {
                            if (err) throw err;
                            return res.send({ error: false, reason: "Ok" });
                        });
                });
        });
    }
});