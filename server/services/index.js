var config = require('../config'),
    Base = require('./base'),
    Github = require('./github'),
    ORM = require('./orm'),

    service;

exports.get = function () {
    if (service) {
        return service;
    }

    var Service = {
            'github': Github,
            'postgres': ORM,
            'mysql': ORM,
            'mongo': ORM
        }[config.get('forum:adapters')];

    if (!Service) {
        throw new Error('Service can not be recognized');
    }

    return new Service();
};



