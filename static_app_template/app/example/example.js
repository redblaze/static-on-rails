var __m__ = function($, dom, cb) {
    dom.page({
        env: __properties__[__env__],
        jquery: $,
        css: ['example'],
        js: ['shared', 'example'],
        templating: [
            function(_, cb) {
                dom.loadHTML('/html/foobar.html', '#foobar', cb)
            },
            function(o, cb) {
                $('#body').append($(o));
                cb();
            },
            function(_, cb) {
                dom.loadJSON('/json/example.json', cb);
            },
            function(json, cb) {
                $('#body').append('<div>' + JSON.stringify(json) + '</div>');
                cb();
            }
        ]
    }, cb);
};

__m__;