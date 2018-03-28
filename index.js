var pg = require('pg');

var execute = function(sql, params, callback) {
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