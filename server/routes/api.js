/**
 *  Router to implement the API to retrieve data for the forum using ajax
 *  Currently 10 routes are available:
 *  - Index:
 *      Path example: /api
 *      Description: The entry point of the API, in response, sends a greeting text
 *  - Create issue:
 *      Path example: POST /api/issues
 *  - Get list of the issues:
 *      Path example: GET /api/issues
 *
 *  - Get issue:
 *      Path example: GET /api/issues/425
 *  - Edit issue (Issue deleted by setting the label removed):
 *      Path example: PUT /api/issues/425
 *
 *  - Create comment:
 *      Path example: POST /api/issues/425/comments
 *  - Get list of the issue`s comments:
 *      Path example: GET /api/issues/425/comments
 *  - Edit comment:
 *      Path example: PUT /api/issues/425/comments/10
 *  - Delete comment:
 *      Path example: DELETE /api/issues/425/comments/10
 *
 *  - Get list of the forum labels:
 *      Path example: DELETE /api/labels
 */

var express = require('express'),
    ApiController = require('../controllers/api.js');

module.exports = function (config) {

    var router = express.Router(),
        controller = new ApiController(config);

    // Hello API /api/
    router.get('/', controller.index.bind(controller));

    // Issues collection (post, get)
    router.route('/issues')
        .post(controller.createIssue.bind(controller))
        .get(controller.getIssues.bind(controller));

    // Issue (get, edit)
    router.route('/issues/:issue_id')
        .get(controller.getIssue.bind(controller))
        .put(controller.editIssue.bind(controller));

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
