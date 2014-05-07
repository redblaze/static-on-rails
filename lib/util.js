var cp = require('child_process');
var cps = require('cps');
var fs = require('fs-extra');
var crypto = require('crypto');

module.exports = function() {
    var runCmd = function(cmd, args, cb) {
        var p = cp.spawn(cmd, args);

        p.on('exit', function (code) {
            if (code === 0) {
                cb();
            } else {
                var err = new Error('cmd error: ' + code);
                cb(err);
            }
        });
    };

    var exeJSFiles = function(jsFiles, cb) {
        var codes = [];

        cps.seq([
            function(_, cb) {
                cps.peach(jsFiles, function(jsFile, cb) {
                    cps.seq([
                        function(_, cb) {
                            fs.readFile(jsFile, 'utf8', cb);
                        },
                        function(o, cb) {
                            codes.push(o);
                            cb();
                        }
                    ], cb);
                }, cb);
            },
            function(_, cb) {
                var __m__;

                $U.each(codes, function(code) {
                    __m__ = eval(code);
                });

                cb(null, __m__);
            }
        ], cb);
    };

    var md5 = function(s) {
        return crypto.createHash('md5').update(s).digest("hex");
    };

    var mergeFiles = function(files, cb) {
        var contents = [];

        cps.seq([
            function(_, cb) {
                cps.peach(file, function(file, cb) {
                    cps.seq([
                        function(_, cb) {
                            fs.readFile(file, 'utf8', cb);
                        },
                        function(content, cb) {
                            contents.push(content);
                            cb();
                        }
                    ], cb);
                }, cb);
            },
            function(_, cb) {
                cb(null, contents.join(''));
            }
        ], cb);
    };

    var loadDocument = function(filePath, jqueryPath, cb) {
        var me = this;

        jsdom.env({
            file: filePath,
            scripts: [jqueryPath],
            'done': cb
        });
    };



    return {
        runCmd: runCmd,
        exeJSFiles: exeJSFiles,
        md5: md5,
        mergeFiles: mergeFiles,
        loadDocument: loadDocument
    };
}();