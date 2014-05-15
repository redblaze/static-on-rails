var __m__ = function($, dom, cb) {
    dom.setEnv(__properties__[__env__]);
    dom.setJQuery($);

    cps.seq([
        function(_, cb) {
            dom.loadJSCSS(cb);
        },
        function(_, cb) {
            dom.addStyle('example', cb);
        },
        function(_, cb) {
            dom.loadHTML('/html/foobar.html', '#foobar', cb)
        },
        function(o, cb) {
            console.log(o);
            $('#body').append($(o));
            console.log($('html').html());
            cb();
        },
        function(_, cb) {
            dom.loadJSON('/json/example.json', cb);
        },
        function(json, cb) {
            $('#body').append('<div>' + JSON.stringify(json) + '</div>');
            cb();
        },
        function(_, cb) {
            dom.addScript('shared', cb);
        },
        function(_, cb) {
            dom.addScript('example', cb);
        },
        function(_, cb) {
            console.log($('html').html());
            cb(null, $('html').html());
        }
    ], cb);
};

__m__;