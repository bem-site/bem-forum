/**
 * Middleware that performs the main role in the application forum.
 * The main task of the middleware is the mount required routes.
 *
 * Required routes:
 * - Page - router to the pages of the forum (index + page of post)
 * - Api - router to implement the API to retrieve data for the forum using ajax
 *
 * Non-required routes (app can work without it):
 * - Auth - router to authenticate users
 *
 * @param baseUrl {String} - base url of the app
 * @param app {Object} - main express app instance
 * @param config {Object} - app config
 * @returns {Function}
 */

module.exports = function (baseUrl, app, config) {

    var pageRouter = require('../routes/page.js')(config),
        serviceRouter = require('../routes/service.js')(config),
        authRouter = require('../routes/auth.js')(config),
        apiRouter = require('../routes/api.js')(config);

    app.use(baseUrl, pageRouter);
    app.use(baseUrl, serviceRouter);
    app.use(baseUrl + 'api', apiRouter);

    if (config.auth && config.auth.login === true) {
        app.use(baseUrl, authRouter);
    }

    return function (req, res, next) {
        next();
    };
};
