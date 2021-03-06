var cps = function() {
    var procedure = function(fn) {
        return function() {
            var cb = arguments[arguments.length - 1];

            try {
                fn.apply(this, arguments);
            } catch(e) {
                handleError(e, cb);
            }
        };
    };

    var handleError = function(e, cb) {
        cb(e);
    };

    var callback = function(cb, fn) {
        var called = false;

        return function(err) {
            if (called) {
                throw new Error('Continuation is being called more than once!');
            }
            called = true;
            try {
                if (err) {
                    handleError(err, cb);
                } else {
                    fn.apply(this, arguments);
                }
            } catch(e) {
                handleError(e, cb);
            }
        };
    };

    var _seq = procedure(function(procs, i, res, cb) {
        if (i >= procs.length) {
            return cb(null, res);
        }
        var proc = procs[i];
        proc(res, callback(cb, function(err, res) {
            return _seq(procs, i+1, res, cb);
        }));
    });

    var seq = function(procs, cb) {
        return _seq(procs, 0, null, cb);
    };

    /*
     var rescue = procedure(function(proc1, proc2, cb) {
     try {
     proc1(function(err, res) {
     if (err) {
     try {
     proc2(err, cb);
     } catch(err) {
     cb(err);
     }
     } else {
     cb(null, res);
     }
     });
     } catch(err) {
     proc2(err, cb);
     }
     });
     */

    var rescue = procedure(function(procBundle, cb) {
        var tryProc = procBundle['try'];
        var catchProc = procBundle['catch'] || function(err, cb) {cb(err);};
        var finallyProc = procBundle['finally'] || function(cb) {cb();};

        var applyTry = procedure(function(cb) {
            tryProc(cb);
        });

        var applyCatch = procedure(function(err, cb) {
            catchProc(err, cb);
        });

        var applyFinallyOk = procedure(function(res0, cb) {
            finallyProc(callback(cb, function(err, res) {
                cb(null, res0);
            }));
        });

        var applyFinallyError = procedure(function(err0, cb) {
            finallyProc(callback(cb, function(err, res) {
                cb(err0);
            }));
        });

        applyTry(function(err, res) {
            if (err) {
                applyCatch(err, function(err, res) {
                    if (err) {
                        applyFinallyError(err, cb);
                    } else {
                        applyFinallyOk(res, cb);
                    }
                });
            } else {
                applyFinallyOk(res, cb);
            }
        });
    });

    var pwhile = procedure(function(procBool, procBody, cb){
        procBool(callback(cb, function(err, res) {
            if (!res) {
                cb();
            } else {
                procBody(callback(cb, function(err, res) {
                    pwhile(procBool, procBody, cb);
                }));
            }
        }));
    });

    var peach = procedure(function(arr, proc, cb) {
        var i = 0;

        pwhile(
            procedure(function(cb) {
                cb(null, i < arr.length);
            }),
            procedure(function(cb) {
                proc(arr[i], callback(cb, function(err, res) {
                    i = i + 1;
                    cb();
                }))
            }),
            cb
        )
    });

    var pfor = procedure(function(n, proc, cb) {
        var i = 0;

        pwhile(
            function(cb) {
                cb(null, i < n);
            },
            function(cb) {
                seq([
                    function(_, cb) {
                        proc(i, cb);
                    },
                    function(_, cb) {
                        i++;
                        cb();
                    }
                ], cb);
            },
            cb
        );
    });

    var pmap = procedure(function(arr, proc, cb) {
        var l = [];

        peach(arr, procedure(function(e, cb) {
            proc(e, callback(cb, function(err, res) {
                l.push(res);
                cb();
            }));
        }), callback(cb, function(err, res) {
            cb(null, l);
        }));
    });

    var _parallel2 = procedure(function(proc1, proc2, cb) {
        var state1 = 'start';
        var state2 = 'start';
        var res1;
        var res2;
        var err1;
        var err2

        var applyProc1 = procedure(function(cb) {
            proc1(cb);
        });

        var applyProc2 = procedure(function(cb) {
            proc2(cb);
        });

        applyProc1(function(err, res) {
            if (err) {
                state1 = 'error';
                err1 = err;
                switch(state2) {
                    case 'start':
                        break;
                    case 'done':
                        cb(null, [
                            {status: 'error', error: err1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    case 'error':
                        cb(null, [
                            {status: 'error', error: err1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    default:
                }
            } else {
                state1 = 'done';
                res1 = res;
                switch(state2) {
                    case 'start':
                        break;
                    case 'done':
                        cb(null, [
                            {status: 'ok', data: res1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    case 'error':
                        cb(null, [
                            {status: 'ok', data: res1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    default:
                }
            }
        });

        applyProc2(function(err, res) {
            if (err) {
                state2 = 'error';
                err2 = err;
                switch(state1) {
                    case 'start':
                        break;
                    case 'done':
                        cb(null, [
                            {status: 'ok', data: res1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    case 'error':
                        cb(null, [
                            {status: 'error', error: err1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    default:
                }
            } else {
                state2 = 'done';
                res2 = res;
                switch(state1) {
                    case 'start':
                        break;
                    case 'done':
                        cb(null, [
                            {status: 'ok', data: res1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    case 'error':
                        cb(null, [
                            {status: 'error', error: err1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    default:
                }
            }
        });
    });

    var _parallel = procedure(function(procs, i, cb) {
        if (procs.length == 0) {
            return cb();
        }

        if (i == procs.length - 1) {
            return procs[i](function(err, res) {
                if (err) {
                    cb(null, [{status: 'error', error: err}]);
                } else {
                    cb(null, [{status: 'ok', data: res}]);
                }
            });
        }

        if (i < procs.length) {
            _parallel2(
                procs[i],
                function(cb) {
                    _parallel(procs, i+1, cb);
                },
                callback(cb, function(err, res) {
                    cb(null, [res[0]].concat(res[1].data));
                })
            );
        }
    });

    var parallel = procedure(function(procs, cb) {
        _parallel(procs, 0, cb);
    });

    return {
        seq: seq,
        peach: peach,
        pwhile: pwhile,
        pmap: pmap,
        pfor: pfor,
        rescue: rescue,
        parallel: parallel
    };
}();