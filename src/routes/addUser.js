const { token } = require('../config.json');
function processCursor(cursor) {
    return new Promise((resolve, reject) =>
        cursor.toArray((err, data) => {
            if (err) return reject(err);
            return resolve(data);
        })
    );
}

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
    handler(req, res) {
        if (req.body.token !== token) return res.send({ error: true, reason: "IncorrectToken" });
        r.db('pixelbattle').table('users').filter({ userID: req.body.userID })
            .run(r.connection, async (err, users) => {
                if (err) throw err;
                users = await processCursor(users);
                if (users[0]) return res.send(users[0]);

                r.db('pixelbattle').table('users').insert([{ userID: req.body.userID, cooldown: 0 }])
                    .run(r.connection, async (err, result) => {
                        if (err) throw err;
                        return res.send({ token: result.generated_keys[0], userID: req.body.userID, cooldown: 0 });
                    });
            });
    }
});