var vow = require('vow'),
    Base = require('./base'),
    ORM = function (options) {
        this.init(options);
    },
    Waterline = require('waterline'),
    waterLine = new Waterline(),

    DEFAULT = {
        page: 1,
        limit: 30,
        sort: {
            field: 'updated',
            direction: 'desc'
        }
    },
    user = require('../models/user'),
    issue = require('../models/issue'),
    comment = require('../models/comment'),
    adapters = {
        disk: require('sails-disk'),
        postgres: require('sails-postgresql')
    };

ORM.prototype = Object.create(Base.prototype);
ORM.prototype.init = function (options) {
    var adapterName = options.connection.adapter,
        waterLineConfig = {
        adapters: {},
        connections: {
           'default': options.connection
        }
    };

    waterLineConfig.adapters[adapterName] = adapters[adapterName];

    waterLine.loadCollection(Waterline.Collection.extend(user));
    waterLine.loadCollection(Waterline.Collection.extend(issue));
    waterLine.loadCollection(Waterline.Collection.extend(comment));

    waterLine.initialize(waterLineConfig, function (err, data) {
        if (err) {
            console.log(err);
            throw err;
        }
        ORM.models = data.collections;
        ORM.connections = data.connections;
    });
};

ORM.prototype.getIssues = function (options) {
    options.page = options.page || DEFAULT.page;
    options.limit = options.per_page || DEFAULT.limit;

    var def = vow.defer();
    ORM.models.issue.find().paginate(options).exec(function(err, models) {
        err ? def.reject() : def.resolve(models);
    });
    return def.promise();
};

ORM.prototype.getIssue = function (options) {
    var def = vow.defer();
    ORM.models.issue.find({ number: options.number }).exec(function (err, model) {
        err ? def.reject() : def.resolve(model);
    });
    return def.promise();
};

ORM.prototype.createIssue = function (options) {
    var def = vow.defer();
    ORM.models.issue.create(options, function (err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
};

ORM.prototype.editIssue = function (options) {
    var def = vow.defer();
    ORM.models.issue.update({ number: options.number }, options, function (err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
};

ORM.prototype.getComments = function (options) {
    var def = vow.defer();
    ORM.models.comment.find({ number: options.number }).exec(function (err, model) {
        err ? def.reject() : def.resolve(model);
    });
    return def.promise();
};

ORM.prototype.createComment = function (options) {
    var def = vow.defer();
    ORM.models.comment.create(options, function (err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
};

ORM.prototype.editComment = function (options) {
    var def = vow.defer();
    ORM.models.comment.update({ id: options.id }, options, function (err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
};

ORM.prototype.deleteComment = function (options) {
    var def = vow.defer();
    ORM.models.comment.destroy({ id: options.id }, function (err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
};

ORM.prototype.getLabels = function (options) {
    // TODO It should be implemented
};

/**
 * Returns authentificated user
 * @param {Object} options  with fields:
 * @param {String} options.token  oauth user token
 * @returns {*}
 */
ORM.prototype.getAuthUser = function (options) {
    var def = vow.defer();
    ORM.models.user.findOne({ id: options.id }, function (err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

/**
 * Create authentificated user
 * @param {Object} options with fields:
 * @param {String} options.token oauth user token
 * @returns {*}
 */
ORM.prototype.createAuthUser = function (options) {
    var def = vow.defer();
    ORM.models.user.create(options, function (err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

/**
 * Edit authentificated user
 * @param {Object} options with fields:
 * @param {String} options.token oauth user token
 * @returns {*}
 */
ORM.prototype.editAuthUser = function (options) {
    var def = vow.defer();
    ORM.models.user.update({ token: options.token }, options, function (err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

ORM.prototype.getRepoInfo = function (options) {
    // TODO It should be implemented
};

module.exports = ORM;
