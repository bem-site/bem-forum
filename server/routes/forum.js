var vow = require('vow'),
    express = require('express'),
    router = express.Router(),
    contollers = require('server/controllers/index.js');
    model = require('server/model.js');

module.exports = function (config) {
    var model = new Model(config);

    /**
     * Handler for every request match on this router
     * Collect baseData (Labels)
     */
    router.get('*', function (req, res, next) {
        return model.getAuthUser(req.cookies['forum_token'], {}).then(function (user) {

            // collect user data
            req.locals.data.user = user;

            return next();
        });
    });

    /**
     * INDEX PAGE ROUTE
     */
    router.get('/', function (req, res, next) {
        return next();
    });

    /**
     * ISSUE`s page
     */
    router.get('/issues/:issue_id', function (req, res, next) {
        return next();
    });

    return router;
};
