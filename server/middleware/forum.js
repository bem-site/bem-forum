var _ = require('lodash'),
    express = require('express');

module.exports = function (url, app, config) {

    var pageRouter = require('../routes/page.js')(express, config),
        //authRouter = require('../routes/auth.js')(express),
        apiRouter = require('../routes/api.js')(express, config);

    /**
     * Auth
     */
    if (config.auth && config.auth.required === true) {

    }

    /**
     * Router use by site url
     */

    app.use(url, pageRouter);
    //app.use(url + 'api', apiRouter);

    return function (req, res, next) {
        next();
    }
};
