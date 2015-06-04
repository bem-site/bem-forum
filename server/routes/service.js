/**
 *  Router to the services pages of the forum
 *
 *  Currently 1 route are available:
 *  Sitemap:
 *      Path example: /sitemap.xml
 *      Description: Get a sitemap contains forum posts
 */

var express = require('express'),
    ServiceController = require('../controllers/service.js');

module.exports = function (config) {
    var controller = new ServiceController(config),
        router = express.Router();

    router.get('/sitemap.xml', controller.sitemap.bind(controller));

    return router;
};
