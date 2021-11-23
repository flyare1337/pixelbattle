const { ended } = require('../config.json');

module.exports = () => ({
    method: "GET",
    url: '/pixels/socket',
    schema: {},
    config: {
        rateLimit: {
            max: 3,
            timeWindow: '1s'
        }
    },
    handler() { return 'aboba'; },
    wsHandler(connection) {
        connection.setEncoding('utf8');
        if (ended) connection.write(JSON.stringify({ op: 'ENDED', value: true }));
    }
});