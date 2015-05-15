var express = require('express'),
    PageController = require('../controllers/page.js');

module.exports = function (config) {
    var controller = new PageController(config);

    return [['/', 'index'], ['/:issue_id([-0-9]+)', 'issue']].reduce(function (router, route) {
        router.get(route[0], controller[route[1]].bind(controller));
        return router;
    }, express.Router());
};
