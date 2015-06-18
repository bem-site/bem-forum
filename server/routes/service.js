/**
 *  Router to the services pages of the forum
 *
 *  Currently 2 routes are available:
 *  Get xml sitemap:
 *      Path example: /sitemap.xml
 *      Description: Get a sitemap contains forum posts
 *  Get json sitemap:
 *      Path example: /sitemap.json
 *      Description: Get a sitemap contains forum posts in json
 */

var express = require('express'),
    ServiceController = require('../controllers/service.js');

module.exports = function (config) {
    var controller = new ServiceController(config),
        router = express.Router();

    router.get('/sitemap.xml', controller.sitemapXml.bind(controller));
    router.get('/sitemap.json', controller.sitemapJson.bind(controller));

    return router;
};
