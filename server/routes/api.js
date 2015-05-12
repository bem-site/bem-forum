var ApiController = require('../controllers/api.js');

module.exports = function (express, config) {

    var router = express.Router(),
        controller = new ApiController(config);

    // Hello API /api/
    router.get('/', controller.index.bind(controller));

    // Issues collection (post, get)
    router.route('/issues')
        .post(controller.createIssue.bind(controller))
        .get(controller.getIssues.bind(controller));

    // Issue (get, edit, delete)
    router.route('/issues/:issue_id')
        .get(controller.getIssue.bind(controller))
        .put(controller.editIssue.bind(controller))
        .delete(controller.deleteIssue.bind(controller));

    // Comments collection (post, get)
    router.route('/issues/:issue_id/comments')
        .post(controller.createComment.bind(controller))
        .get(controller.getComments.bind(controller));

    // Comment (edit, delete)
    router.route('/issues/:issue_id/comments/:comment_id')
        .put(controller.editComment.bind(controller))
        .delete(controller.deleteComment.bind(controller));

    router.route('/labels')
        .get(controller.getLabels.bind(controller));

    return router;
};
