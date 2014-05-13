
Error.stackTraceLimit = Infinity;
var rootPath = process.cwd();

var cps = require('cps');
var fs = require('fs-extra');

var path = require('path');
var currentDir = path.dirname(require.main.filename);

var util = require('../lib/util.js');

var cb = function(err, res) {
    if (err) {
        console.log('ERROR:', err);
        if (err.stack) {
            console.log('STACK:', err.stack);
        }
    } else {
        console.log('OK:', res);
    }
};

util.runCmd('cp', ['-r', currentDir + '/../static_app_template/*', '.'], cb);







