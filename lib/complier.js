
var cps = require('cps');
var $U = require('underscore');
var Class = require('better-js-class');
var jsdom = require('jsdom');
var fs = require('fs-extra');
var minify = require('yuglify');


var util = require('./util.js');
var Dom = require('./node_dom.js');

var Compiler = Class({
    _init: function(conf) {
        this._rootPath = conf['rootPath'];
        this._cfgPath = conf['cfgPath'];
        this._buildCfg = {
            'css': [],
            'js': []
        };
    },

    _getFullPath: function(path) {
        return this._rootPath + path;
    },

    _prepareCfg: function(cb) {
        var me = this;

        cps.seq([
            function(_, cb) {
                fs.readFile(me._cfgPath, 'utf8', cb);
            },
            function(content, cb) {
                me._cfg = JSON.parse(content);
                cb(null, me._cfg);
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
                minifiedCSSFileName = 'minified_css_' + md5(minifiedCSS) + '.css';
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
                minifiedJSFileName = 'minified_js_' + md5(minifiedJS) + '.js';
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
        for (var k in cfg['css']) {
            pages.push([k, me._cfg['css'][k]]);
        }

        cps.peach(pages, function(page, cb) {
            cps.seq([
                function(_, cb) {
                    me._prepareCSS(page[1], cb);
                },
                function(fileName, cb) {
                    me._buildCfg['css'][page[0]] = '/css/'+ fileName;
                    cb();
                }
            ], cb);

        }, cb);
    },

    _prepareAllJS: function(cb) {
        var me = this;

        var pages = [];
        for (var k in cfg['js']) {
            pages.push([k, me._cfg['js'][k]]);
        }

        cps.peach(pages, function(page, cb) {
            cps.seq([
                function(_, cb) {
                    me._prepareJS(page, cb);
                },
                function(fileName, cb) {
                    me._buildCfg['js'][page[0]] = '/js/'+ fileName;
                    cb();
                }
            ], cb);

        }, cb);
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
                cb(null, me._buildCfg);
            }
        ], cb);
    },

    _compile: function(name, cb) {
        var htmlStartString = '<!DOCTYPE html><html>';
        var htmlEndString = '</html>';

        var $;
        var srcPrefix = this._getFullPath('/app/' + name + '/' + name);
        var htmlFile = srcPrefix + '.html';
        var jsFile = srcPrefix + '.js';

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
            filePath: '',
            jqueryPath: '',
            cfg: cfg
        });

        var __m__;

        cps.seq([
            function(_, cb) {
                jsdom.env({
                    file: filePath,
                    scripts: [jqueryPath],
                    'done': cb
                });
            }
        ], cb);

    }







});