Error.stackTraceLimit = Infinity;

var rootPath = process.cwd();

var path = require('path');

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


var cfg = {
    rootPath: rootPath
};

var compiler = new Compiler(cfg);
compiler.run(cb);
