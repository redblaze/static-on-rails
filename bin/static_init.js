#!/usr/bin/env node
Error.stackTraceLimit = Infinity;
var path = require('path');
var currentDir = path.dirname(require.main.filename);
var rootDir = process.cwd();
var fs = require('fs-extra');

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

var src = path.join(currentDir, '..', 'static_app_template');
var dst = rootDir;
fs.copy(src, dst, cb);







