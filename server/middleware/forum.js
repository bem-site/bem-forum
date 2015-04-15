var _ = require('lodash'),
    express = require('express'),

    githubOAuth = require('github-oauth');

module.exports = function (app, config) {

    var apiRouter = require('../routes/api.js')(express),
        Controller = require('../controller.js');

    /**
     * One controller for all sites
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
        router.get(':issue_id', controller.issue.bind(controller, site));


        /**
         * Auth
         */
        if (config.auth) {

        }
        router.get('/login', controller.login.bind(controller, site));
        router.get('/login_callback', controller.loginCallback.bind(controller, site));
        router.get('/logout', controller.logout.bind(controller, site));

        /**
         * Router use by site url
         */

        app.use(site.url, router);
    });

    return function (req, res, next) {
        next();
    }
};
