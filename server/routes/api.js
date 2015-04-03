module.exports = function (express) {

    var apiRouter = express.Router();

    /**
     * API BASE ROUTE
     */
    apiRouter.get('/api', function (req, res, next) {
        return res.end('Hello! This is BEM forum API.');
    });

    /**
     * API ISSUES
     */
    apiRouter.route('/api/issues')
        // create new issue
        .post(function (req, res, next) {
            res.end('create new issue')
        })

        // get all issues
        .get(function (req, res, next) {
            res.end('get issues');
        });

    apiRouter.route('/api/issues/:issue_id')
        // get the issue with that id
        .get(function (req, res, next) {
            res.end('issue id: ' + (req.params && req.params.issue_id));
        })

        // update the issue with this id
        .put(function (req, res, next) {
            res.end('edit issue');
        })

        // delete the issue with this id
        .delete(function (req, res, next) {
            res.end('delete issue');
        });

    /**
     * API COMMENTS
     */
    apiRouter.route('/api/issues/:issue_id/comments')
        .post(function (req, res, next) {
            res.end('create new comment');
        })

        .get(function (req, res, next) {
            res.end('get comments');
        });

    apiRouter.route('api/issues/:issue_id/comments/:comment_id')
        .put(function (req, res, next) {
            console.log('EDIT COMMENTs>>>>>>>>>>>>>');
            next();
        })
        .delete(function (req, res, next) {
            console.log('DELETE COMMENTs>>>>>>>>>>>>>');
            next();
        });

    return apiRouter;
};
