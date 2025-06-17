
// Ordered by alphabetical order
module.exports = (app) => {

    app.use('/api', require('./admin.js'));

    app.use('/api/aiUser', require('./aiUser.js'));

    app.use('/api/auth', require('./auth.js'));

    app.use('/api/battle', require('./battle.js'));

    app.use('/api/season', require('./seasons.js'));

    app.use('/api/skills', require('./skills.js'));

    app.use('/api/users', require('./users.js'));

    app.use('/api/gacha', require('./gachas.js'));

    app.use('/api/inventory', require('./inventory.js'));

}

