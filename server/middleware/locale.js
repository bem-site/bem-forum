/**
 * Middleware for set default lang from config
 * @returns {Function}
 */

module.exports = function (defaultLanguage) {
    return function (req, res, next) {
        req.lang = defaultLanguage;
        return next();
    };
};
