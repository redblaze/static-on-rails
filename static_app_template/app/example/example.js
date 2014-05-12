$.ajaxSetup({
    cache: false
});

var __m__ = function($, dom, cb) {
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
            $('#body').append($(o));
            cb();
        },
        function(_, cb) {
            dom.addScript('example', cb);
        },
        function(_, cb) {
            cb(null, $('html').html());
        }
    ], cb);
};


__m__;