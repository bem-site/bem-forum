var AuthController = require('../controllers/auth.js');

module.exports = function (express, config) {
    var router = express.Router(),
        controller = new AuthController(config);

    router.get('/login', controller.login.bind(controller));
    router.get('/login_callback', controller.loginCallback.bind(controller));
    router.get('/logout', controller.logout.bind(controller));

    return router;
};
