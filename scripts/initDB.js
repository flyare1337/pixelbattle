const rethinkdb = require('rethinkdb');
const config = require('../src/config.json');

(async () => {
    const db = await rethinkdb.connect(config.database);

    await rethinkdb.dbCreate('pixelbattle').run(db);

    await rethinkdb.db('pixelbattle').tableCreate('pixels').run(db);
    await rethinkdb.db('pixelbattle').tableCreate('users').run(db);
    
    await rethinkdb
        .db('pixelbattle')
        .table('pixels')
        .insert(new Array(4000).fill(0).map((_, i) => ({ id: i, color: '#FFFFFF' })))
        .run(db);
})();