const { ended } = require('../config.json');
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
    url: '/pixels/get',
    schema: {},
    config: {
        rateLimit: {
            max: 3,
            timeWindow: '1s'
        }
    },
    handler(req, res) {
        r.db('pixelbattle').table('pixels').run(r.connection, async (err, pixels) => {
            if (err) throw err;
            pixels = await processCursor(pixels);
            return res.send({ ended, pixels });
        });
    }
});