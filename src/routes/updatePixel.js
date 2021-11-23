const { ended, cooldownTime } = require('../config.json');
const rethinkdb = require('rethinkdb');

const hexRegExp = /^#[0-9A-F]{6}$/i;

module.exports = (r) => ({
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
            max: 5,
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

        let cooldown;
        let adminCheck = ["178404926869733376", "299917043484983296"].includes(req.userSession.userID);
        switch (adminCheck) {
            case true:
                cooldown = 0;
                break;

            case false:
                cooldown = Date.now() + cooldownTime;
                break;
        }

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

        req.server.websocketServer.clients.forEach((client) =>
            client.readyState === 1 &&
                client.send(JSON.stringify({
                        op: 'PLACE',
                        id: pixelID,
                        color
                    })
                )
        );

        return res.send({ error: false, reason: "Ok" });
    }
});
