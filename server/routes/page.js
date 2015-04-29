var PageController = require('../controllers/page.js');

module.exports = function (express, config) {
    /**
     * Create router
     */
    var router = express.Router(),
        controller = new PageController(config);

    /**
     * Index page route
     */
    router.get('/', controller.index.bind(controller));

    /**
     * Post page
     */
    router.get(':issue_id', controller.issue.bind(controller));

    return router;
};


