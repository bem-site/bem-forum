/**
 *  Router to the pages of the forum
 *  Currently available are 3 route:
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
