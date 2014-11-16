var _ = require('lodash'),
    vow = require('vow'),
    mime = require('mime-types'),

    auth = require('./auth'),
    model = require('./model'),
    template = require('./template'),
    routes = require('./routes'),
    util = require('./util'),

    baseUrl = '/forum/';

module.exports = function(pattern, options) {

    baseUrl = pattern || baseUrl;

    routes.init(baseUrl);
    auth.init(options);
    template.init(options);
    model.init(options);

    var ownerToken = options.owner_token,
        // for check, if user checked at least one label
        // for create/edit issue forms - knowledge is taken
        // from common config website
        labelsRequired = options.labelsRequired,
        forumDebug = options.debug;

    return function(req, res, next) {
        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            method,
            token,
            options,
            isGetRequest,
            isDeleteRequest;

        // fix mime type for block images
        if(!route) {
            res
                .type(mime.lookup(req.url))
                .end();
            return;
        }

        query = route[1]; //params hash
        route = route[0]; //route object

        //get action that should be called
        action = route.getName();
        method = route.getData().method;

        isGetRequest = 'GET' === method;
        isDeleteRequest = 'DELETE' === method;

        // get access token after redirect
        if('index' === action && query.code) {
            return auth.getAccessToken(req, res, query.code);
        }

        // for all non get requests and when forum token cookie is not exists
        // send request for user authorization
        if((!isGetRequest || 'auth' === action) && (!req.cookies || !req.cookies['forum_token'])) {
            return auth.sendAuthRequest(req, res);
        }

        token = req.cookies['forum_token'];
        token && model.addUserAPI(token);

        if(!action) {
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

        function checkVotes(number) {
            console.log('number', number);

            var def = vow.defer(),
                isCheater = null,
                votedUser = [],
                newParams = {
                    vote_button: true,
                    vote: 0
                },
                username = req.cookies && req.cookies.forum_username;

            console.log('username', username);

            model.getComments(token, { number : number }).then(function(comments) {
                comments.forEach(function(comment) {
                    if ((username === comment.user.login) && newParams.vote_button) {
                        newParams.vote_button = false;
                    }

                    if (/\:\+1\:/.test(comment.body)) {
                        isCheater = votedUser.some(function(user) {
                            return comment.user.login === user;
                        });

                        if (!isCheater) {
                            console.log('no chiter');
                            votedUser.push(comment.user.login);
                            newParams.vote = newParams.vote + 1;
                        } else {
                            console.log('chiter stop!');
                        }
                    }
                });

                return def.resolve(newParams);

            }, function(err) {
                def.reject(err);
            });

            return def.promise();
        }

        function vote(data, comments, issue) {
            issue.isList = data.view === 'issues';
            // show-hide button vote
            issue.vote_button = (data.user.login === issue.user.login);

            var vote = 0,
                isCheater = false,
                votedUser = [];

            comments.forEach(function(comment) {
                if (data.user.login === comment.user.login && issue.vote_button) {
                    issue.vote_button = false;
                }

                if (/\:\+1\:/.test(comment.body)) {
                    isCheater = votedUser.some(function(user) {
                        return comment.user.login === user;
                    });
                    if (!isCheater && (data.user !== comment.user.login)) {
                        votedUser.push(comment.user.login);
                        vote++;
                    }
                }
            });

            issue.vote = vote;
            issue.comments = comments;
        }

        // get full page from server on first enter
        if(!req.xhr) {
            // collect all required data for templates
            var promises = {
                repo: model.getRepoInfo(token, {}),
                user: model.getAuthUser(token, {}),
                labels: model.getLabels (token, {})
            };

            if(options.number) {
                // get issue data, that have a number option
                _.extend(promises, {
                    issue: model.getIssue(token, options),
                    comments: model.getComments(token, options),
                    view: 'issue'
                });
            } else {
                _.extend(promises, {
                    issues: model.getIssues(token, options),
                    view: 'issues'
                });
            }

            return vow.all(promises)
                .then(function(values) {
                    var def = vow.defer();

                    if (values.view === 'issues') {
                        var issues = values.issues;

                        var commentPromises = issues.map(function(issue) {
                            return model.getComments(token, { number : issue.number });
                        });

                        vow.all(commentPromises).then(function(result) {
                            result.forEach(function(comments, idx) {
                                vote(values, comments, issues[idx]);
                            });
                            def.resolve(values);
                        });
                    } else {
                        var issue = values.issue;

                        model.getComments(token, { number : issue.number }).then(function(comments) {
                            vote(values, comments, issue);
                            def.resolve(values);
                        }, function(err) {
                            console.error(err);
                        })
                    }

                    return def.promise();
                })
                .then(function(values) {
                    req.__data = req.__data || {};
                    req.__data.forum = values;

                    // set global params window.forum.{params}
                    req.__data.forum.global = {
                        debug: (forumDebug && options.debug === 'true')
                    };

                    return next();
                })
                .fail(function(err) {
                    console.err(err);
                });
        } else {
            if(action === 'getVotes') {
                checkVotes(options.number).then(function(params) {
                    res.json(params);
                }).fail(function(err) {
                    console.error('err', err);
                });

                return;
            }

            // ajax requests
            var result = {};

            // do something with owner right,
            // e.g. add labels when user create/edit issue
            if(query.__access === 'owner' && ownerToken) {
                token = ownerToken;
                model.addUserAPI(token);
            }

            // create issue without checked labels - default behaviors
            var isIssueAction = (action === 'createIssue' || action === 'editIssue');

            if((isIssueAction && !options.labels) || (isIssueAction && !ownerToken)) {
                options.labels = [];
            }

            // get data by ajax
            return model[action](token, options)
                .then(function(data) {
                    if('json' === query.__mode) {
                        res.json(data);
                        return;
                    }

                    // check if current page is last for paginator
                    if('getIssues' === action) {
                        result.isLastPage = (!data.length || data.length < 30)
                    }

                    return template.run(_.extend(templateCtx[action] || {}, { data: data }), req);
                })
                .then(function(html) {
                    if(action === 'getIssues') {
                        result.html = html;
                        res.json(result);
                    } else {
                        res.end(html);
                    }
                })
                .fail(function(err) {
                    res.end(err);
                });
        }
    };
};
