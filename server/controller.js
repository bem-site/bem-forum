var _ = require('lodash'),
    Model = require('./models/model.js'),
    Auth = require('./auth.js'),
    Logger = require('bem-site-logger'),
    vow = require('vow');

function Controller(config) {
    this._init(config);
}

Controller.prototype = {

    _init: function (config) {
        this._model = new Model(config);
        this._auth = new Auth(config);
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
    },

    /**
     * Base controller, use on every request,
     * that match default`s forum router.
     * 1. Get from model labels by lang and user info by token from req.cookies
     * 2. Extend req.locals.forum with labels and users data
     * @param {Object} site - current site config
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @returns {*}
     */
    _base: function (req, res) {
        var _this = this,
            def = vow.defer(),
            lang = req.lang;

        vow.all({
            labels: this._model.getLabels(lang)
            //user: this._model.getAuthUser(req.cookies['forum_token'], {})
        }).then(function (data) {

            // set previous url for correct login redirect
            _this._setPreviousUrl(req);

            // collect user data
            res.locals.forum = _.extend(_this._getLocalData(res), data);

            return def.resolve();

        }).fail(function (err) {
            return def.reject(err);
        });

        return def.promise();
    },

    login: function (req, res) {
        var token = this._auth.getToken(req);

        if (token) {
            return this._redirectAfter(req, res, 303, 'login');
        }

        this._auth.sendAuthRequest(req, res);
    },

    loginCallback: function (req, res) {
        var _this = this,
            code = req.query && req.query.code,
            strUrl = 'login_callback';

        if (!code || code && this._auth.getToken(req)) {
            return this._redirectAfter(req, res, 303, strUrl);
        }

        this._auth.getAccessToken(req, res, code, function (err, access_token) {

            if (err) {
                return _this._redirectAfter(req, res, 500, strUrl);
            }

            _this._auth.setToken(res, access_token);
            _this._redirectAfter(req, res, 303, strUrl);
        });
    },

    logout: function (req, res) {
        var token = this._auth.getToken(req);

        if (!token) {
            return this._redirectAfter(req, res, 303, 'logout');
        }

        res.clearCookie('forum_token', { path: '/' });
        this._redirectAfter(req, res, 303, 'logout');
    },

    /**
     * Index page controller
     * 1. Get from model page title and issues list
     * 2. Extend req.locals.forum with data got in 1 item
     * 3. Set for template view type -> 'issues'
     * @param {Object} site - current site config
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @param {Function} next - express js call next middleware
     * @returns {*}
     */
    index: function (req, res, next) {

        return this._base(req, res)
            .then(function () {
                return next();
            })
            .fail(function (err) {
                return next(err);
            });

        //return vow.all({
        //    //title: this._model.getTitle(lang),
        //    issues: this._model.getIssues(token, this._config, lang)
        //
        //}).then(function (data) {
        //
        //    // collect final data
        //    _.extend(this._getLocalData(req), data, { view: 'issues' });
        //
        //    return next();
        //});
    },

    /**
     * Issue page controller
     * 1. Get from model page title, issue, issue`s comments to show on load
     * 2. Extend req.locals with data got in 1 item
     * 3. Set for template view type -> 'issue'
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @param {Function} next - express js call next middleware
     * @returns {*}
     */
    issue: function (req, res, next) {
        var token = req.cookies && req.cookies['forum_token'],
            lang = req.lang,
            id = req.params.issue_id;

        return vow.all({
            title: this._model.getTitle(lang, id),
            issue: this._model.getIssue(token, id, lang),
            comments: this._model.getComments(token, id)

        }).then(function (data) {

            req.locals.forum = _.extend(this._getLocalData(req), data, { view: 'issue' });

            return next();
        });
    },

    /**
     * Get forum data from req.locals.forum.
     * p.s. When the forum is used as a separate middleware
     * this method needed for extend data that collect earlier
     * with forum`s data
     * @param {Object} res - express js response
     * @returns {Object} res.local.forum
     * @private
     */
    _getLocalData: function (res) {
        var locals = res.locals;

        return locals.forum ? locals.forum : (locals.forum = {});
    },

    _redirectAfter: function (req, res, statusCode, urlPart) {
        var previousUrl = this._getPreviousUrl(req);

        res.location(previousUrl ? previousUrl : req.url.replace(urlPart, ''));
        return res.status(statusCode).end();
    },

    _getPreviousUrl: function (req) {
        var session = req.session;

        return session && session.previousUrl;
    },

    _setPreviousUrl: function (req) {
        var session = req.session;

        if (session) {
            session.previousUrl = req.url;
        } else {
            this._logger.warn('Add session middleware for correct auth work');
        }
    }
};

module.exports = Controller;
