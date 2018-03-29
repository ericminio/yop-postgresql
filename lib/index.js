var pg = require('pg');
var { Promise, Promises } = require('yop-promises');

var execute = function(sql, params, callback) {
    if (typeof sql == 'string') {
        if (typeof params == 'function') {
            callback = params;
            params = [];
        }
        run(sql, params, callback);
    }
    else {
        if (typeof params == 'function') {
            callback = params;
        }
        if (sql.length == 0) { callback([]); }
        else {
            var statements = sql;
            var runStatement = function(i) {
                var p = new Promise();
                var sql = statements[i].sql;
                var params = statements[i].params;
                if (typeof statements[i] == 'string') {
                    sql = statements[i];                    
                }
                if (params === undefined) { params = []; }
                run(sql, params, function(rows, error) {
                    if (error) { p.reject(error); }
                    else { p.resolve(rows); }
                });
                return p;
            }
            var ps = new Promises();
            var i=0; 
            var stop = false;
            var rows = [];
            ps.done(()=>{
                if (!stop) { 
                    if (i==statements.length-1) {
                        return callback(rows);
                    } else {
                        var p = runStatement(++i);
                        p.done(function(data) {
                            rows = data;
                        })
                        .catch(function(error) {
                            stop = true;
                            callback([], error);
                        });
                        ps.waitFor(p);
                    }
                }
            });
            var p = runStatement(0);
            p.done(function(data) {
                rows = data;
            })
            .catch(function(error) {
                stop = true;
                callback([], error);
            });
            ps.waitFor(p);
        }        
    }
};

var run = function(sql, params, callback) {
    var client = new pg.Client()
    client.connect(function(err) {
        if (err) { callback([], err); client.end(); return; }        
        client.query(sql, params, function(err, result) {
            if (err) { callback([], err); client.end(); return; }
            client.end();
            callback(result.rows);
        });
    });
};

module.exports = {
    execute:execute
};