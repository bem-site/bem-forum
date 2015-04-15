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

        githubOAuth({
            githubClient: process.env['GITHUB_CLIENT'],
            githubSecret: process.env['GITHUB_SECRET'],
            baseURL: 'http://localhost',
            loginURI: '/login',
            callbackURI: '/callback',
            scope: 'public_repo' // optional, default scope is set to user
        });

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
         * Router use by site url
         */

        app.use(site.url, router);
    });

    return function (req, res, next) {
        next();
    }
};
