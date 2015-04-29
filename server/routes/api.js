var ApiCtrl = require('../controllers/api.js');

module.exports = function (express) {

    var router = express.Router(),
        ctrl = new ApiCtrl();

    // Hello API /api/
    router.get('/', ctrl.index.bind(ctrl));

    // Issues collection (post, get)
    router.route('/issues')
        .post(ctrl.postIssue.bind(ctrl))
        .get(ctrl.getIssues.bind(ctrl));

    // Issue (get, edit, delete)
    router.route('/issues/:issue_id')
        .get(ctrl.getIssue.bind(ctrl))
        .put(ctrl.editIssue.bind(ctrl))
        .delete(ctrl.deleteIssue.bind(ctrl));

    // Comments collection (post, get)
    router.route('/issues/:issue_id/comments')
        .post(ctrl.postComment.bind(ctrl))
        .get(ctrl.getComments.bind(ctrl));

    // Comment (edit, delete)
    router.route('/issues/:issue_id/comments/:comment_id')
        .put(ctrl.editComment.bind(ctrl))
        .delete(ctrl.deleteComment.bind(ctrl));

    return router;
};
