
var cps = require('cps');
var $U = require('underscore');
var Class = require('better-js-class');
var jsdom = require('jsdom');
var fs = require('fs-extra');
var minify = require('yuglify');


var util = require('./util.js');
var Dom = require('./node_dom.js');

module.exports = Class({
    _init: function(conf) {
        this._rootPath = conf['rootPath'];
        this._jqueryPath = conf['jqueryPath'];
        this._excludedApps = conf['excludedApps'];

        this._builtJSCSS = {
            'css': {},
            'js': {}
        };
    },

    _getFullPath: function(path) {
        return this._rootPath + path;
    },

    _prepareCfg: function(cb) {
        var me = this;

        cps.seq([
            function(_, cb) {
                fs.readFile(me._getFullPath('/js_css.json'), 'utf8', cb);
            },
            function(content, cb) {
                me._jscss = JSON.parse(content);
                cb(null, me._jscss);
            }
        ], cb);
    },

    _prepareCSS: function(_paths, cb) {
        var me = this;

        var paths = $U.map(_paths, function(path) {
            return me._getFullPath(path);
        });

        var minifiedCSSFileName;

        cps.seq([
            function(_, cb) {
                util.mergeFiles(paths, cb);
            },
            function(mergedCSS, cb) {
                minify.cssmin(mergedCSS, cb);
            },
            function(minifiedCSS, cb) {
                minifiedCSSFileName = 'minified_css_' + util.md5(minifiedCSS) + '.css';
                fs.writeFile(me._getFullPath('/build/css/' + minifiedCSSFileName), minifiedCSS, 'utf8', cb);
            },
            function(_, cb) {
                cb(null, minifiedCSSFileName);
            }
        ], cb);
    },

    _prepareJS: function(_paths, cb) {
        var me = this;

        var paths = $U.map(_paths, function(path) {
            return me._getFullPath(path);
        });

        var minifiedJSFileName;

        cps.seq([
            function(_, cb) {
                util.mergeFiles(paths, cb);
            },
            function(mergedJS, cb) {
                minify.jsmin(mergedJS, cb);
            },
            function(minifiedJS, cb) {
                minifiedJSFileName = 'minified_js_' + util.md5(minifiedJS) + '.js';
                fs.writeFile(me._getFullPath('/build/js/' + minifiedJSFileName), minifiedJS, 'utf8', cb);
            },
            function(_, cb) {
                cb(null, minifiedJSFileName);
            }
        ], cb);
    },

    _prepareAllCSS: function(cb) {
        var me = this;

        var pages = [];
        for (var k in me._jscss['css']) {
            pages.push([k, me._jscss['css'][k]]);
        }

        cps.peach(pages, function(page, cb) {
            cps.seq([
                function(_, cb) {
                    me._prepareCSS(page[1], cb);
                },
                function(fileName, cb) {
                    me._builtJSCSS['css'][page[0]] = '/css/'+ fileName;
                    cb();
                }
            ], cb);

        }, cb);
    },

    _prepareAllJS: function(cb) {
        var me = this;

        var pages = [];
        for (var k in me._jscss['js']) {
            pages.push([k, me._jscss['js'][k]]);
        }

        cps.peach(pages, function(page, cb) {
            cps.seq([
                function(_, cb) {
                    me._prepareJS(page[1], cb);
                },
                function(fileName, cb) {
                    me._builtJSCSS['js'][page[0]] = '/js/'+ fileName;
                    cb();
                }
            ], cb);

        }, cb);
    },

    _writeJSCSSFile: function(cb) {
        var me = this;
        var path = me._getFullPath('/build/js_css.json');

        cps.seq([
            function(_, cb) {
                fs.writeFile(path, JSON.stringify(me._builtJSCSS), 'utf8', cb);
            },
            function(_, cb) {
                cb(null, me._builtJSCSS);
            }
        ], cb);
    },

    _prepareAllJSCSS: function(cb) {
        var me = this;

        cps.seq([
            function(_, cb) {
                me._prepareCfg(cb);
            },
            function(_, cb) {
                me._prepareAllCSS(cb);
            },
            function(_, cb) {
                me._prepareAllJS(cb);
            },
            function(_, cb) {
                me._writeJSCSSFile(cb);
            }
        ], cb);
    },

    _compile: function(name, cb) {
        var me = this;

        var htmlStartString = '<!DOCTYPE html><html>';
        var htmlEndString = '</html>';

        var $;
        var srcPrefix = this._getFullPath('/app/' + name + '/' + name);
        var htmlFile = srcPrefix + '.html';
        var jsFile = srcPrefix + '.js';
        var jqueryPath = this._getFullPath(this._jqueryPath);

        var targetDir;
        var targetFile;

        if (name == 'index') {
            targetDir = this._getFullPath('/build');
            targetFile = targetDir + '/index.html';
        } else if (name == '404') {
            targetDir = this._getFullPath('/build');
            targetFile = targetDir + '/404.html';
        } else if (name == '401') {
            targetDir = this._getFullPath('/build');
            targetFile = targetDir + '/401.html';
        } else {
            targetDir = this._getFullPath('/build/' + name);
            targetFile = targetDir + '/index.html';
        }

        var dom = new Dom({
            rootPath: me._rootPath,
            jqueryPath: jqueryPath,
            jscss: me._builtJSCSS
        });

        cps.seq([
            function(_, cb) {
                jsdom.env({
                    file: htmlFile,
                    scripts: [jqueryPath],
                    'done': cb
                });
            },
            function(window, cb) {
                $ = window.$;
                $.__window__ = window;

                var jsFiles = [];
                var compilerScripts = $('script.compiler').each(function() {
                    var src = $(this).prop('src');
                    if (src && !$(this).hasClass('exclude')) { // Don't run js files that are marked as excluded, e.g., loadHTML.js.  The compiling uses another version of the APIs defined in loadHTML.js.
                        jsFiles.push(src);
                    }
                });
                console.log(jsFiles);
                util.exeJSFiles($U.map(jsFiles, function(jsFile) {
                    return me._getFullPath(jsFile);
                }), cb);
            },
            function(__m__, cb) {
                __m__($, dom, cb);
            },
            function(_, cb) {
                $('script.jsdom').remove();
                $('script.compiler').remove();
                cb();
            },
            function(_, cb) {
                fs.mkdirp(targetDir, cb);
            },
            function(_, cb) {
                fs.writeFile(targetFile, htmlStartString + $('html').html() + htmlEndString, 'utf8', cb);
            }
        ], cb);
    },

    _copyAssets: function(buildDir, cb) {
        var me = this;

        cps.peach(['images', 'fonts', 'html', 'json'], function(name, cb) {
            // util.runCmd('cp', ['-r', me._getFullPath('/' + name), buildDir], cb);
            var sourceDir = me._getFullPath('/' + name);
            var targetDir = buildDir + '/' + name;
            cps.seq([
                function(_, cb) {
                    cb(null, fs.existsSync(sourceDir));
                },
                function(fileExists, cb) {
                    if (fileExists) {
                        me._copyDir(sourceDir, targetDir, cb);
                    } else {
                        cb()
                    }
                }
            ], cb);
        }, cb);
    },

    _copyDir: function(sourceDir, targetDir, cb) {
        var me = this;

        cps.seq([
            function(_, cb) {
                fs.mkdirs(targetDir, cb);
            },
            function(_, cb) {
                fs.copy(sourceDir, targetDir, cb);
            }
        ], cb);
    },

    _prepareBuildDir: function(cb) {
        var me = this;

        var buildDir = me._getFullPath('/build');
        console.log('Build Dir: ', buildDir);
        var jsDir = buildDir + '/js';
        var cssDir = buildDir + '/css';

        cps.seq([
            function(_, cb) {
                fs.remove(buildDir, cb);
            },
            function(_, cb) {
                fs.mkdir(buildDir, cb);
            },
            function(_, cb) {
                fs.mkdir(cssDir, cb);
            },
            function(_, cb) {
                fs.mkdir(jsDir, cb);
            },
            function(_, cb) {
                me._copyAssets(buildDir, cb);
            }
        ], cb);

    },

    _listAllApps: function(cb) {
        var me = this;

        var names;
        var dirs = [];
        var appDir = me._getFullPath('/app');

        cps.seq([
            function(_, cb) {
                fs.readdir(appDir, cb);
            },
            function(names, cb) {
                cps.peach(names, function(name, cb) {
                    cps.seq([
                        function(_, cb) {
                            fs.stat(appDir + '/' + name, cb);
                        },
                        function(stat, cb) {
                            if (stat.isDirectory() && !$U.contains(me._excludedApps, name)) {
                                dirs.push(name);
                            }
                            cb();
                        }
                    ], cb);
                }, cb);
            },
            function(_, cb) {
                console.log('list of projects: ', dirs);
                cb(null, dirs);
            }
        ], cb);
    },

    run: function(cb) {
        var me = this;
        var dirs;

        cps.seq([
            function(_, cb) {
                me._prepareBuildDir(cb);
            },
            function(_, cb) {
                me._prepareAllJSCSS(cb);
            },
            function(_, cb) {
                me._listAllApps(cb);
            },
            function(dirs, cb) {
                cps.peach(dirs, function(dir, cb) {
                    cps.seq([
                        function(_, cb) {
                            console.log('start compiling project ' + dir);
                            me._compile(dir, cb);
                        },
                        function(_, cb) {
                            console.log('finished compilation of project ' + dir);
                            cb();
                        }
                    ], cb);
                }, cb);
            }
        ], cb);
    }
});