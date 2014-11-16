var vow = require('vow'),
    Base = require('./base'),
    generator = require('../generator'),
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
    label = require('../models/label'),
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
    waterLine.loadCollection(Waterline.Collection.extend(label));
    waterLine.loadCollection(Waterline.Collection.extend(issue));
    waterLine.loadCollection(Waterline.Collection.extend(comment));

    waterLine.initialize(waterLineConfig, function (err, data) {
        if (err) {
            console.log(err);
            throw err;
        }
        ORM.models = data.collections;
        ORM.connections = data.connections;

        // stub data
        (new generator.LabelsGenerator(ORM)).generate();
        (new generator.UsersGenerator(ORM)).generate();
        (new generator.IssuesGenerator(ORM)).generate();
        (new generator.CommentsGenerator(ORM)).generate();
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
    ORM.models.issue.find({ id: options.number }).exec(function (err, model) {
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
    ORM.models.issue.update({ id: options.number }, options, function (err, object) {
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
    console.log('create comment %s', JSON.stringify(options));

    var def = vow.defer();
    options['updated_at'] = options['created_at'] = new Date();
    ORM.models.comment.create(options, function (err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
};

ORM.prototype.editComment = function (options) {
    var def = vow.defer();
    options['updated_at'] = new Date();
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
    var def = vow.defer();
    ORM.models.label.find().exec(function (err, model) {
        err ? def.reject() : def.resolve(model);
    });
    return def.promise();
};

/**
 * Returns user by criteria
 * @param {Object} options  with fields:
 * @param {String} options.token  oauth user token
 * @returns {*}
 */
ORM.prototype.getUser = function (options) {
    var def = vow.defer();
    ORM.models.user.findOne(options, function (err, model) {
        //model = {
        //    "login": "octocat",
        //    "id": 1,
        //    "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        //    "name": "monalisa octocat",
        //    "email": "octocat@github.com",
        //};
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

/**
 * Create user
 * @param {Object} options with fields:
 * @param {String} options.token oauth user token
 * @param {String} options.name
 * @param {String} options.login
 * @param {String} options.avatar_url
 * @param {String} options.uid
 * @param {String} options.token
 * @param {String} options.email
 * @returns {*}
 */
ORM.prototype.createUser = function (options) {
    var def = vow.defer();
    ORM.models.user.create(options, function (err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

/**
 * Edit user
 * @param {Object} options with fields:
 * @param {String} options.token oauth user token
 * @returns {*}
 */
ORM.prototype.editUser = function (options) {
    var def = vow.defer();
    ORM.models.user.update({ token: options.token }, options, function (err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

ORM.prototype.getRepoInfo = function (options) {
    return this.getIssues(options).then(function (issues) {
        return { open_issues: issues.length };
    });
};

module.exports = ORM;
