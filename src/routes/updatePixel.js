const { ended, cooldownTime } = require('../config.json');
const rethinkdb = require('rethinkdb');

const hexRegExp = /^#[0-9A-F]{6}$/i;

module.exports = (r, ee) => ({
    method: "POST",
    url: '/pixels/put',
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
    async preHandler(req, res, done) {
        const user = await rethinkdb
            .db('pixelbattle')
            .table('users')
            .get(req.body.token)
            .run(r);

        if (!user) return res.send({ error: true, reason: "NotAuthorized" });
        if (ended) return res.send({ error: true, reason: "Ended" });
        if (user.cooldown > Date.now()) return res.send({
            error: true,
            reason: "UserCooldown", 
            cooldown: Math.round((user.cooldown - Date.now()) / 1000)
        });

        req.userSession = user;
        done();
    },
    async handler(req, res) {
        const pixelID = req.body.id;
        const color = req.body.color;

        if (!hexRegExp.test(color)) return res.send({ error: true, reason: "IncorrectColor" });

        const pixel = rethinkdb.db('pixelbattle').table('pixels').get(pixelID).run(r);
        if (!pixel) return res.send({ error: true, reason: "IncorrectPixel" });

        await rethinkdb
            .db('pixelbattle')
            .table('users')
            .get(req.body.token)
            .update({ cooldown: Date.now() + cooldownTime })
            .run(r);

        await rethinkdb
            .db('pixelbattle')
            .table('pixels')
            .get(pixelID)
            .update({ color, tag: req.userSession.tag })
            .run(r);

        ee.emit('place', { op: 'PLACE', id: pixelID, color });

        return res.send({ error: false, reason: "Ok" });
    }
});
