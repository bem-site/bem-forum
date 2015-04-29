var AuthCtrl = require('../controllers/auth.js');

module.exports = function (express) {
    /**
     * Create router
     */
    var router = express.Router(),
        ctrl = new AuthCtrl();

    router.get('/login', ctrl.login.bind(ctrl));
    router.get('/login_callback', ctrl.loginCallback.bind(ctrl));
    router.get('/logout', ctrl.logout.bind(ctrl));

    return router;
};
