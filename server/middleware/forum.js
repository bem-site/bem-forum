var express = require('express');

module.exports = function (app, config) {

    var url = config.url,
        router = express.Router(),
        //apiRouter = require('../routes/api.js')(express),

        Controller = require('../controller.js');

    console.log('router', router);

    /**
     * INIT SECTION
     */
    var controller = new Controller(config);

    /**
     * Handler for every request match on this router
     * Collect baseData (Labels)
     */
    //router.get('*', controller.base);

    /**
     * INDEX PAGE ROUTE
     */
    router.get('/', controller.index);

    /**
     * ISSUE`s page
     */
    //router.get('/issues/:issue_id', controller.issue);

    /**
     * Routers use
     */
    app.use('/', router);
    //app.use(url, apiRouter);
};
