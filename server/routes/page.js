/**
 *  Router to the pages of the forum
 *
 *  Currently 2 routes are available:
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
    var controller = new PageController(config),
        router = express.Router(),
        routingTable = {
            '/': 'index',
            '/:issue_id([-0-9]+)': 'issue'
        };

    Object.keys(routingTable).forEach(function (route) {
        router.get(route, controller[routingTable[route]].bind(controller));
    });

    return router;
};
