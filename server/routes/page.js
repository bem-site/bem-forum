var PageController = require('../controllers/page.js');

module.exports = function (express, config) {
    var router = express.Router(),
        controller = new PageController(config);

    router.get('/', controller.index.bind(controller));
    router.get('/:issue_id([0-9]+)', controller.issue.bind(controller));

    return router;
};
