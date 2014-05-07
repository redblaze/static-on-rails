var jsdom = require('jsdom');
var Class = require('better-js-class');
var cps = require('cps');


module.exports = function() {
    var Dom = Class({
        _init: function(conf) {
            this._filePath = conf['filePath'];
            this._jqueryPath = conf['jqueryPath'];
            this._jscss = conf['jscss'];
        },

        setEvn: function(env) {
            this._env = env;
        },

        _processLink: function($, node){
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

            node.find('a[data-link-type="grails"]').each(function() {
                var nd = $(this),
                    href = nd.attr('href'),
                    host = me._env['hrefBaseUrl'];

                nd.attr('href', host + href);
            });
        },

        loadHTML: function(cb) {
            var me = this;
            var $;

            cps.seq([
                function(_, cb) {
                    jsdom.env({
                        file: me._filePath,
                        scripts: [me._jqueryPath],
                        'done': cb
                    });
                },
                function(window) {
                    $ = window.$;
                    $.__window__ = window;
                    me._jquery = $;
                    var node = $(cssSelector);
                    me._processLinks($, node);
                    cb(null, node[0].innerHTML);
                }
            ], cb);
        },

        addStyle: function(name) {
            var $ = this._jquery;
            var addCSSNode = function(path) {
                $('head').append($('<link rel="stylesheet" href="' + path + '"/>'));
            };
            console.log('name: ' + name);
            var cssFiles = me._jscss['css'][name];
            for (var i = 0; i < cssFiles.length; i++) {
                // addCSSNode('/css/' + cssFiles[i]);
                addCSSNode(cssFiles[i]);
            }

            return unit();
        },

        addScript: function(name) {
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
            for (var i = 0; i < jsFiles.length; i++) {
                // addScriptNode('/js/' + jsFiles[i]);
                addScriptNode(jsFiles[i]);
            }

            return unit();
        }

    });
}();

