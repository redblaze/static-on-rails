var jsdom = require('jsdom');
var Class = require('better-js-class');
var cps = require('cps');
var request = require('request');
var fs = require('fs-extra');


module.exports = Class({
    _init: function(conf) {
        this._rootPath = conf['rootPath'];
        this._jqueryPath = conf['jqueryPath'];
        this._jscss = conf['jscss'];
    },

    setEnv: function(env) {
        this._env = env;
    },

    setJQuery: function($) {
        this._jquery = $;
    },

    _processLinks: function($, node){
        var me = this;

        node.find('a[data-link-type="static"]').each(function() {
            var nd = $(this),
                name = nd.data('app-name'),
                rest = nd.data('link-rest'),
                href;

            if(name === 'index'){
                href = '/';
            }   else    {
                href = '/' + name + '/';
            }

            href += rest || "";

            nd.attr('href', href);
        });

        node.find('a[data-link-type="dynamic"]').each(function() {
            var nd = $(this),
                href = nd.attr('href'),
                host = me._env['dynamic-host'];

            nd.attr('href', host + href);
        });
    },

    loadHTML: function(url, cssSelector, cb) {
        var me = this;
        var $;

        cps.seq([
            function(_, cb) {
                jsdom.env({
                    file: me._rootPath + url,
                    scripts: [me._jqueryPath],
                    'done': cb
                });
            },
            function(window) {
                $ = window.$;
                $.__window__ = window;
                var node = $(cssSelector);
                me._processLinks($, node);
                cb(null, node[0].outerHTML);
            }
        ], cb);
    },

    addStyle: function(name, cb) {
        var me = this;

        var $ = this._jquery;
        var addCSSNode = function(path) {
            $('head').append($('<link rel="stylesheet" href="' + path + '"/>'));
        };
        console.log('name: ' + name);
        var cssFiles = me._jscss['css'][name];
        if (cssFiles == null) {
            console.log('no css package: ' + name);
            cb();
        } else {
            addCSSNode(cssFiles);
            cb();
        }
    },

    addScript: function(name, cb) {
        var me = this;
        var $ = this._jquery;

        var addScriptNode = function(src) {
            var window = $.__window__;
            var document = window.document;

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            document.body.appendChild(script);
        };

        var jsFiles = me._jscss['js'][name];
        if (jsFiles == null) {
            console.log('no js package: ' + name);
            cb();
        } else {
            addScriptNode(jsFiles);
            cb();
        }
    },

    loadJSCSS: function(cb) {
        cb();
    },

    loadJSON: function(url, cb) {
        var me = this;

        fs.readFile(me._rootPath + url, function (err, res) {
            if (err) {
                cb(err);
            } else {
                var json = JSON.parse(res);
                cb(null, json);
            }
        });
    },

    page: function(conf, cb) {
        var me = this;

        me.setEnv(conf['env']);
        me.setJQuery(conf['jquery']);

        var $ = me._jquery;

        cps.seq([
            function(_, cb) {
                me.loadJSCSS(cb);
            },
            function(_, cb) {
                cps.peach(conf['css'] || [], function(name, cb) {
                    me.addStyle(name, cb);
                }, cb);
            },
            function(_, cb) {
                cps.seq(conf['html'] || [], cb);
            },
            function(_, cb) {
                cps.peach(conf['js'] || [], function(name, cb) {
                    me.addScript(name, cb);
                }, cb);
            },
            function(_, cb) {
                cb(null, $('html').html());
            }
        ], cb);
    }
});


