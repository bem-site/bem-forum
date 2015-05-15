var express = require('express'),
    AuthController = require('../controllers/auth.js');

module.exports = function (config) {
    var controller = new AuthController(config);

    return [
        ['/login', 'login'],
        ['/login_callback', 'loginCallback'],
        ['/logout', 'logout']
    ].reduce(function (router, route) {
            router.get(route[0], controller[route[1]].bind(controller));
            return router;
    }, express.Router());
};
