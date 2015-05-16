/**
 *  Router to authenticate users
 *  Currently available are 2 route:
 *  Index:
 *      Path example: /forum?page=1; /forum?page=-1 (Archive)
 *      Description: page with a list of posts and the right column with the list of tags for filtering
 *  Post:
 *      Path example: /forum/425; /forum/-425 (Archive)
 *      Description: page to display a single post, which immediately displays all comments
 */

var express = require('express'),
    PageController = require('../controllers/page.js');

module.exports = function (config) {
    var controller = new PageController(config);

    return [['/', 'index'], ['/:issue_id([-0-9]+)', 'issue']].reduce(function (router, route) {
        router.get(route[0], controller[route[1]].bind(controller));
        return router;
    }, express.Router());
};
