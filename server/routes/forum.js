var express = require('express'),
    router = express.Router(),
    contollers = require('/server/controllers/index.js');

module.exports = function (config) {
    var isMiddlewareIntergate = (config.integrate === 'middleware');

    /**
     * Handler for every request match on this router
     * Collect baseData (Labels)
     */
    router.use(function (req, res, next) {
        console.log('router every request');
        next();
    });

    /**
     * INDEX PAGE ROUTE
     */
    router.get('/', function (req, res, next) {

        if (isMiddlewareIntergate) {
            return next();
        }

        res.end('Index');
    });

    /**
     * ISSUE`s page
     */
    router.get('/issues/:issue_id', function (req, res, next) {

        if (isMiddlewareIntergate) {
            return next();
        }

        res.end('Issue page with id: ' + (req.params && req.params.issue_id));
    });

    return router;
};
