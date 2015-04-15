var _ = require('lodash'),
    express = require('express');

module.exports = function (app, config) {

    var apiRouter = require('../routes/api.js')(express),
        Controller = require('../controller.js');

    /**
     * INIT SECTION
     */
    var controller = new Controller(config);

    /**
     * Create router for every sites
     */
    _.forEach(config.sites, function (site) {

        var router = express.Router();

        /**
         * Index page route
         */
        router.get('/', controller.index.bind(controller, site));

        /**
         * Post page
         */
        router.get('/:issue_id', controller.issue.bind(controller));

        /**
         * Router use by site url
         */
        app.use(site.url, router);
    });

    return function (req, res, next) {
        next();
    }
};
