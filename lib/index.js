var pg = require('pg')
const util = require('util')

var executeSync = async function(sql, params) {
    var statements = normalize(sql, params)
    var rows = await runAll(statements)

    return rows
}
var execute = function(sql, params, callback) {
    if (typeof params == 'function') {
        callback = params
    }
    var callbackified = util.callbackify(executeSync)
    callbackified(sql, params, (err, rows)=> {
        if (err) {
            rows = []
        }
        callback(rows, err)
    })
}
var normalize = function(sql, params) {
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
    return statements
}
var runAll = async (statements)=>{
    var rows = []
    for (var i=0; i<statements.length; i++) {
        var statement = statements[i]
        var p = new Promise((resolve, reject)=>{
            run(statement.sql, statement.params, function(rows, error) {
                if (error) { reject(error); }
                else { resolve(rows); }
            })
        })
        rows = await p
    }
    return rows
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
    execute: execute,
    executeSync: executeSync
};
