var config = require('../config'),
    Github = require('./github'),
    ORM = require('./orm'),

    service;

exports.get = function () {
    if (service) {
        return service;
    }

    var adapters = config.get('forum:adapters');
    var currentAdapterName = Object.keys(adapters)[0];

    var Service = {
            'github': Github,
            'postgres': ORM,
            'mysql': ORM,
            'mongo': ORM,
            'disk': ORM
        }[currentAdapterName];

    if (!Service) {
        throw new Error('Service can not be recognized');
    }

    service = new Service({
        connection: adapters[currentAdapterName]
    });

    return service;
};



