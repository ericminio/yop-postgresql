var pg = require('pg');
var Promise = require('yop-promises').promise;
var Promises = require('yop-promises').promises;

var execute = function(sql, params, callback) {
    if (typeof sql == 'string') {
        run(sql, params, callback);
    }
    else {
        if (typeof params == 'function') {
            callback = params;
        }
        if (sql.length == 0) { callback([]); }
        else {
            var data = [];
            var statements = sql;
            var runStatement = function(i) {
                var p = new Promise();
                var sql = statements[i].sql;
                var params = statements[i].params;
                if (params === undefined) { params = [];}
                run(sql, params, function(rows) {
                    data = rows;
                    p.resolve();
                });
                return p;
            }
            var ps = new Promises();
            var i=0; 
            ps.done(()=>{
                if (i==statements.length-1) {
                    callback(data);
                } else {
                    ps.waitFor(runStatement(++i));
                }
            });
            ps.waitFor(runStatement(0));
        }        
    }
};

var run = function(sql, params, callback) {
    var client = new pg.Client()
    client.connect(function(err) {
        if (err) { throw err; }        
        client.query(sql, params, function(err, result) {
            if (err) { throw err; }
            client.end();
            callback(result.rows);
        });
    });
};

module.exports = {
    execute:execute
};