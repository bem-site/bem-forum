var Model = require('server/model.js'),
    vow = require('vow');

function Controller(config) {
    this.model = new Model(config);
    this.config = config;
}

Controller.prototype = {
    base: function (req, res, next) {

        return vow.all({
            labels: this.model.getLabels(token, lang),
            user: this.model.getAuthUser(req.cookies['forum_token'], {})
        }).then(function (data) {

            // collect user data
            _.extend(this._getData(req), data);

            return next();
        });
    },

    index: function (req, res, next) {
        var token = req.cookies['forum_token'],
            lang = req.lang;

        return vow.all({
            title: this.model.getTitle(lang),
            issues: this.model.getIssues(token, this.config, lang)

        }).then(function (data) {

            // collect final data
            _.extend(this._getData(req), data, { view: 'issues' });

            return next();
        });
    },

    issue: function (req, res, next) {
        var token = req.cookies['forum_token'],
            lang = req.lang,
            id = req.params.issue_id;

        return vow.all({
            title: this.model.getTitle(lang, id),
            issue: this.model.getIssue(token, id, lang),
            comments: this.model.getComments(token, id)

        }).then(function (data) {

            _.extend(this._getData(req), data, { view: 'issue' });

            return next();
        });
    },

    /**
     * Get forum data from req.locals.forum.
     * p.s. When forum uses like middleware,
     * this method needed for extend data that collect earlier
     * @param {Object} req - express-js request
     * @returns {Object}
     * @private
     */
    _getData: function (req) {
        var data = {},
            locals = req.locals;

        if (locals) {
            data = locals.forum ? locals.forum : (locals.forum = {});
        }

        return data;
    }
};

module.exports = Controller;
