const config = require('./config.json');
const fs = require('fs');
const rethinkdb = require('rethinkdb');
const fastify = require('fastify');
const path = require("path");
const EventEmitter = require("events");

(async () => {
    const db = await rethinkdb.connect(config.database);
    console.info('* [Main] Connected to database');

    const app = fastify();

    app
        .register(require('fastify-cors'), { origin: '*' })
        .register(require('fastify-formbody'))
        .register(require('fastify-rate-limit'), {
            keyGenerator: (req) => req.headers['cf-connectiong-ip'] || req.ip,
            global: true
        })
        .register(require('fastify-sse-v2').FastifySSEPlugin);

    const pixelsEvents = new EventEmitter();

    for (const file of fs.readdirSync(path.join(__dirname, "routes")).filter(
        file => file.endsWith('.js')
    )) {
        const route = require(`./routes/${file}`)(db, pixelsEvents);
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
})();
