var _ = require('lodash');

module.exports = function (baseUrl, app, config) {

    var pageRouter = require('../routes/page.js')(config),
        authRouter = require('../routes/auth.js')(config),
        apiRouter = require('../routes/api.js')(config);

    /**
     * Router use by site url
     */

    app.use(baseUrl, pageRouter);
    app.use(baseUrl + 'api', apiRouter);

    /**
     * Auth
     */
    if (config.auth && config.auth.login === true) {
        app.use(baseUrl, authRouter)
    }

    return function (req, res, next) {
        next();
    }
};
