const rethinkdb = require('rethinkdb');

module.exports = (r) => ({
    method: "GET",
    url: '/pixels/get/tag',
    schema: {},
    config: {
        rateLimit: {
            max: 2,
            timeWindow: '5s'
        }
    },
    async handler(req, res) {
        let pixels = await (await rethinkdb
            .db('pixelbattle')
            .table('pixels')
            .run(r)
        ).toArray();

        let used = pixels.filter(x => x.tag !== null);
        let unused = pixels.filter(x => x.tag == null);

        let tags = {};
        for (let x of used) {
            if (!tags[x.tag]) tags[x.tag] = 1;
            tags[x.tag]++;
        }

        return res.send({
            pixels: {
                all: used.length + unused.length,
                used: used.length,
                unused: unused.length
            }, tags: Object.entries(tags).sort((x, y) => y - x).slice(0, 10)
        });
    }
});
