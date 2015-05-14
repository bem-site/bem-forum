var _ = require('lodash'),
    express = require('express');

module.exports = function (url, app, config) {

    var pageRouter = require('../routes/page.js')(express, config),
        authRouter = require('../routes/auth.js')(express, config),
        apiRouter = require('../routes/api.js')(express, config);

    /**
     * Router use by site url
     */

    app.use(url, pageRouter);
    app.use(url + 'api', apiRouter);

    /**
     * Auth
     */
    if (config.auth && config.auth.login === true) {
        app.use(url, authRouter)
    }

    return function (req, res, next) {
        next();
    }
};
