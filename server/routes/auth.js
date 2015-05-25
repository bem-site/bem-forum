/**
 *  Router to authenticate users
 *
 *  Currently 3 routes are available:
 *  - Login:
 *      Path example: /login
 *      Description: Redirected to github for authorization оAuth
 *  - Login callback:
 *      Path example: /login_callback
 *      Description: After successful authorization, github will redirect to this url
 *      with a temporary query code - which is needed in order
 *      to once again turn to github and obtain a user token.
 *      If the token is received, set the cookie of the user
 *      and redirect him to the page where he made the entrance to the forum
 *  - Logout:
 *     Path example: /logout
 *     Description: Remove the cookie of the user and reloads the current page
 */

var express = require('express'),
    AuthController = require('../controllers/auth.js');

module.exports = function (config) {
    var controller = new AuthController(config),
    router = express.Router(),
        routingTable = {
            '/login': 'login',
            '/login_callback': 'loginCallback',
            '/logout': 'logout'
        };

    Object.keys(routingTable).forEach(function (route) {
        router.get(route, controller[routingTable[route]].bind(controller));
    });

    return router;
};
