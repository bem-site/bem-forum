var express = require('express');

module.exports = function (app, config) {

    var url = config.url,
        router = express.Router(),
        apiRouter = require('../routes/api.js')(express),
        Controller = require('../controller.js');

    /**
     * INIT SECTION
     */
    var controller = new Controller(config);

    /**
     * Handler for every request match on this router
     * Collect baseData (Labels)
     */
    router.get('*', controller.base.bind(controller));

    /**
     * INDEX PAGE ROUTE
     */
    router.get('/', controller.index.bind(controller));

    /**
     * ISSUE`s page
     */
    router.get('/issues/:issue_id', controller.issue.bind(controller));

    /**
     * Routers use
     */
    app.use(url, router);
    //app.use(url, apiRouter);

    return function (req, res, next) {
        next();
    }
};
