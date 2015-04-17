var _ = require('lodash'),
    express = require('express');

module.exports = function (url, app, config) {

    var apiRouter = require('../routes/api.js')(express),
        Controller = require('../controller.js');

    /**
     * One controller for all sites
     */
    var controller = new Controller(config);

    /**
     * Create router
     */
    var router = express.Router();

    /**
     * Index page route
     */
    router.get('/', controller.index.bind(controller));

    /**
     * Post page
     */
    router.get(':issue_id', controller.issue.bind(controller));

    /**
     * Auth
     */
    if (config.auth && config.auth.required === true) {
        router.get('/login', controller.login.bind(controller));
        router.get('/login_callback', controller.loginCallback.bind(controller));
        router.get('/logout', controller.logout.bind(controller));
    }

    /**
     * Router use by site url
     */

    app.use(url, router);

    return function (req, res, next) {
        next();
    }
};
