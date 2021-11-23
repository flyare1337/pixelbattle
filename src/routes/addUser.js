const { token } = require('../config.json');
const rethinkdb = require('rethinkdb');

module.exports = (r) => ({
    method: "POST",
    url: '/addUser',
    schema: {
        body: {
            type: 'object',
            required: ['token', 'userID'],
            properties: {
                token: { type: 'string' },
                userID: { type: 'string' }
            }
        }
    },
    async handler(req, res) {
        if (req.body.token !== token) return res.send({ error: true, reason: "IncorrectToken" });

        const [user] = await (await rethinkdb
            .db('pixelbattle')
            .table('users')
            .filter({ userID: req.body.userID })
            .run(r)).toArray();

        if (user) return res.send(user);

        const result = await rethinkdb
            .db('pixelbattle')
            .table('users')
            .insert([{ userID: req.body.userID, cooldown: 0, tag: null }])
            .run(r);

        return res.send({ token: result.generated_keys[0], userID: req.body.userID, cooldown: 0, tag: null });
    }
});