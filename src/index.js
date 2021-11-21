const config = require('./config.json');
const fs = require('fs');

const r = require('rethinkdb');
r.connect(config.database, (err, conn) => {
    if (err) throw err;
    r.connection = conn;
    console.info('* [Main] Connected to database');
});

const fastify = require('fastify');
const app = fastify({ logger: false });

app.register(require('fastify-cors'));
app.register(require('fastify-formbody'));
app.register(require('fastify-rate-limit'), {
    keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip,
    global: true
});

for (const file of fs.readdirSync('./routes').filter(
    file => file.endsWith('.js') && !file.endsWith('.disabled.js')
)) {
    const route = require(`./routes/${file}`)(r);
    console.log(`* Loading route [${route.method}] ${route.url}`);
    app.route(route);
}

app.listen(config.port, '0.0.0.0', (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }

    console.log(`* [Main] Server is now listening on ${address}`);
});