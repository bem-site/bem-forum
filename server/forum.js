var _ = require('lodash'),
    vow = require('vow'),
    mime = require('mime-types'),

    auth = require('./auth'),
    services = require('./services'),
    template = require('./template'),
    routes = require('./routes'),
    util = require('./util'),

    baseUrl = '/forum/';

module.exports = function (pattern, forumOptions, passport) {

    baseUrl = pattern || baseUrl;

    routes.init(baseUrl);
    auth.init(forumOptions);
    template.init(forumOptions);
    services.get();

    var ownerToken = forumOptions.owner_token,
        // for check, if user checked at least one label
        // for create/edit issue forms - knowledge is taken
        // from common config website
        labelsRequired = forumOptions.labelsRequired,
        forumDebug = forumOptions.debug;

    return function (req, res, next) {
        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            method,
            token,
            options,
            isGetRequest,
            isDeleteRequest;

        // fix mime type for block images
        if (!route) {
            res
                .type(mime.lookup(req.url))
                .end();
            return;
        }

        query = route[1]; // params hash
        route = route[0]; // route object

        // get action that should be called
        action = route.getName();
        method = route.getData().method;

        isGetRequest = method === 'GET';
        isDeleteRequest = method === 'DELETE';

        Object.keys(forumOptions.passport.strategies).forEach(function (name) {
            // console.log("Strategy name: ", name);
            // console.log("Current action: ", action);
            switch (action) {
                case name + 'Auth':
                    passport.authenticate(name)(req, res, next);
                    break;
                case name + 'AuthCallback':
                    res.cookie('test', 'test');
                    passport.authenticate(name, function (err, user, info) {
                            var expires = new Date(Date.now() + (86400000 * 5)); // 5 days
                            res.cookie('forum_username', user.username, { expires: expires });
                            req.logIn(user, function(err) {
                                    if (err) { return next(err); }

                                    // res.cookie('forum_token', access_token, { expires: expires });

                                    return res.redirect('/');
                                });
                        }
                        //,
                        //function (err, accessToken, user) {
                        //    console.log("AccessToken: ", accessToken);
                        //    console.log("User: ", user);
                        //    req.login(user, function(err) {
                        //        if (err) { return next(err); }
                        //        return res.redirect("/");
                        //    });
                        //}
                    )(req, res, next);
                    break;
            }
        });

        // get access token after redirect
        //if (action === 'index' && query.code) {
        //    return auth.getAccessToken(req, res, query.code);
        //}
        //
        //// for all non get requests and when forum token cookie is not exists
        //// send request for user authorization
        //if ((!isGetRequest || action === 'auth') && (!req.cookies || !req.cookies['forum_token'])) {
        //    return auth.sendAuthRequest(req, res);
        //}
        //
        //token = req.cookies['forum_token'];
        //token && services.get().addUserAPI({ token: token });

        if (!action) {
            res.writeHead(500);
            res.end('Action was not found');
            return;
        }

        options = (isGetRequest || isDeleteRequest ? query : req.body) || {};

        // for access in templates
        req = _.extend(req, {
            forumUrl: baseUrl,
            labelsRequired: labelsRequired,
            util: util,
            csrf: 'csrf'
        });

        var templateCtx = {
            getIssues:     { block: 'forum-issues' },
            getIssue:      { block: 'issue' },
            createIssue:   { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired, csrf: req.csrf },
            editIssue:     { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired, csrf: req.csrf },
            getComments:   { block: 'comments', mods: { view: 'close' }, issueNumber: options.number, forumUrl: req.forumUrl },
            createComment: { block: 'comment', issueNumber: options.number, forumUrl: req.forumUrl, csrf: req.csrf },
            editComment:   { block: 'comment', issueNumber: options.number, forumUrl: req.forumUrl, csrf: req.csrf },
            getLabels:     { block: 'forum-labels', mods: { view: options.view } }
        };

        // get full page from server on first enter
        if (!req.xhr) {
            // collect all required data for templates
            var promises = {
                repo: services.get().getRepoInfo({ token: token }),
                user: services.get().getAuthUser({ token: token }),
                labels: services.get().getLabels ({ token: token })
            };

            if (options.number) {
                // get issue data, that have a number option
                _.extend(promises, {
                    issue: services.get().getIssue(_.extend({ token: token }, options)),
                    comments: services.get().getComments(_.extend({ token: token }, options)),
                    view: 'issue'
                });
            } else {
                _.extend(promises, {
                    issues: services.get().getIssues(_.extend({ token: token }, options)),
                    view: 'issues'
                });
            }

            return vow.all(promises)
                .then (function(values) {
                    req.__data = req.__data || {};
                    req.__data.forum = values;

                    // set global params window.forum.{params}
                    req.__data.forum.global = {
                        debug: (forumDebug && options.debug === 'true')
                    };

                    return next();
                })
                .fail (function(err) {
                    console.err(err);
                });
        } else {
            // ajax requests
            var result = {};

            // do something with owner right,
            // e.g. add labels when user create/edit issue
            if (query.__access === 'owner' && ownerToken) {
                token = ownerToken;
                services.get().addUserAPI({ token: token });
            }

            // create issue without checked labels - default behaviors
            var isIssueAction = (action === 'createIssue' || action === 'editIssue');

            if ((isIssueAction && !options.labels) || (isIssueAction && !ownerToken)) {
                options.labels = [];
            }

            // get data by ajax
            return services.get()[action](_.extend({ token: token }, options))
                .then(function (data) {
                    if (query.__mode === 'json') {
                        res.json(data);
                        return;
                    }

                    // check if current page is last for paginator
                    if (action === 'getIssues') {
                        result.isLastPage = (!data.length || data.length < 30)
                    }

                    return template.run(_.extend(templateCtx[action] || {}, { data: data }), req);
                })
                .then(function (html) {
                    if (action === 'getIssues') {
                        result.html = html;
                        res.json(result);
                    } else {
                        res.end(html);
                    }
                })
                .fail(function (err) {
                    res.end(err);
                });
        }
    };
};
