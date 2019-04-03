var pg = require('pg');
var { Promise, Promises } = require('yop-promises');

var execute = function(sql, params, callback) {
    if (typeof params == 'object' && callback == undefined
        || params == undefined && callback == undefined) {
        if (params == undefined) { params = [] }
        var p = new Promise();
        run(sql, params, function(rows, err) {
            p.resolve(rows)
        });
        return p;
    }

    if (typeof params == 'function') {
        callback = params
    }
    if (sql.length == 0) {
        callback([])
    }
    var statements = sql
    if (typeof sql == 'string') {
        var statement = { sql:sql, params:[] }
        if (typeof params == 'object') {
            statement.params = params
        }
        statements = [statement]
    }
    for (var i=0; i<statements.length; i++) {
        if (typeof statements[i] == 'string') {
            statements[i] = {
                sql:statements[i],
                params:[]
            }
        }
    }

    var i = 0
    var p = new Promise()
    p.done(function(data) {
        if (i == statements.length-1) {
            all.resolve(data)
        } else {
            i += 1
            runStatement(statements[i], p)
        }
    })
    .catch(function(error) {
        all.reject(error)
    })
    runStatement(statements[i], p)

    var all = new Promise()
    all.done((data)=>{
        callback(data)
    })
    all.catch((error)=>{
        callback([], error)
    })
};

var runStatement = function(statement, then) {
    run(statement.sql, statement.params, function(rows, error) {
        if (error) { then.reject(error); }
        else { then.resolve(rows); }
    });
}

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
