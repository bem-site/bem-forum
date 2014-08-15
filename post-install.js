var path = require('path'),
    util = require('util'),
    cp = require('child_process'),

    _ = require('lodash'),
    vow = require('vow');

/**
 * Run command in child process
 * @param cmd - {String} command to run
 * @param opts - {Object} options for command execution
 * @param name - {String} command name for log
 * @returns {defer.promise|*}
 */
function runCommand(cmd, opts, name) {
    var baseOpts = {
        encoding: 'utf8',
        maxBuffer: 1000000 * 1024
    };

    function _exec(cmd, options) {
        var proc = cp.exec(cmd, options),
            def = vow.defer(),
            output = '';

        proc.on('exit', function(code) {
            if (code === 0) { return def.resolve(); }
            def.reject(new Error(util.format('%s failed: %s', cmd, output)));
        });

        proc.stderr.on('data', function(data) { output += data; });
        proc.stdout.on('data', function(data) { output += data; });
        return def.promise();
    }

    console.info('execute command %s', cmd);

    return _exec(cmd, _.extend(opts, baseOpts))
        .then(function() {
            console.info('command completed %s', name);
            return vow.resolve();
        })
        .fail(function(error) {
            console.error('command %s failed with error %s', name, error);
            return vow.reject(error);
        });
}

return (function() {
        console.info('--- application install ---');
        return vow.resolve(process.env.NODE_ENV || 'development')
    })()
    .then(function(env) {
        return runCommand(util.format('ln -snf %s current', env), {
            cwd: path.join(process.cwd(), 'configs')
        }, 'set config')
    })
    .then(function() {
        return runCommand('bower install', {}, 'bower install')
    })
    .then(function() {
        return runCommand('enb make --no-cache', {}, 'enb make')
    })
    .then(function() {
        return console.info('--- application installed successfully ---');
    })
    .fail(function(err) {
        console.err('post install script failed with error %s', err.message);
    });

