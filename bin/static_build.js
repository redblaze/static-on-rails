#!/usr/bin/env node

Error.stackTraceLimit = Infinity;
var fs = require('fs-extra');
var cps = require('cps');

var rootPath = process.cwd();


var Compiler = require('../lib/compiler.js');


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


cps.seq([
    function(_, cb) {
        var path = rootPath + '/config.json';
        fs.readFile(path, cb);
    },
    function(_, cb) {
        var cfg = JSON.parse(_);
        var cfg = {
            rootPath: rootPath,
            jqueryPath: cfg['jquery-path'],
            excludedApps: cfg['excluded-apps'] || [],
            minify: cfg['minify'] == null? true : cfg['minify']
        };

        var compiler = new Compiler(cfg);
        compiler.run(cb);
    }
], cb);

