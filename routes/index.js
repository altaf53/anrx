function initRoutes(app){
    const apiRoutes = require('./api');
    app.use('/', apiRoutes);
}

module.exports = initRoutes;