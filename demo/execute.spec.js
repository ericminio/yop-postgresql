var expect = require('chai').expect;
var { execute } = require('../lib');

describe('execute', () => {

    beforeEach(()=>{
        process.env.PGUSER='postgres';
        process.env.PGDATABASE='postgres';
        process.env.PGHOST='localhost';
        process.env.PGPASSWORD='';        
    });
    it('is available', (done) => {
        execute('select current_user', [], (rows)=>{
            expect(rows[0].current_user).to.equal('postgres');
            done();
        });
    });
    it('accept parameters', (done)=>{
        execute('create table if not exists greatness(id int, name varchar)', [], ()=>{
            execute('truncate table greatness', [], ()=>{
                execute('insert into greatness(id, name) values($1, $2)', [1, 'liberty'], ()=> {
                    execute('select name from greatness', [], function(rows) {
                        expect(rows.length).to.equal(1);
                        expect(rows[0].name).to.equal('liberty');
                        done();
                    });
                });
            });
        });
    });
    it('can run statements in order', (done)=>{
        var all = [
            { sql: 'create table if not exists greatness(id int, name varchar)' },
            { sql: 'truncate table greatness' },
            { sql: 'insert into greatness(id, name) values($1, $2)', params:[1, 'liberty'] },
            { sql: 'insert into greatness(id, name) values($1, $2)', params:[2, 'equality'] },
            { sql: 'insert into greatness(id, name) values($1, $2)', params:[3, 'fraternity'] },
            { sql: 'select name from greatness' }
        ];
        execute(all, (rows)=>{
            expect(rows.length).to.equal(3);
            expect(rows[2].name).to.equal('fraternity');
            done();
        });
    });
    it('support empty collection', (done)=>{
        execute([], (rows)=>{
            expect(rows).to.deep.equal([]);
            done();
        });
    });
    it('let sql errors bubble', (done)=>{
        execute('select from unknown', [], (rows, error)=>{
            expect(error.message).to.contain('"unknown" does not exist');
            done();
        });
    });
    it('let connection errors bubble', (done)=>{
        process.env.PGUSER='unknown';
        process.env.PGDATABASE='unknown';
        process.env.PGHOST='unknown';
        process.env.PGPASSWORD='unknown'; 
        execute('select from unknown', [], (rows, error)=>{
            expect(rows).to.deep.equal([]);
            expect(error.message).to.contain('getaddrinfo ENOTFOUND unknown');
            done();
        });
    });
    it('defaults error to undefined', (done)=>{
        execute('select current_user', [], (rows, error)=>{
            expect(error).to.equal(undefined);
            done();
        });
    });
});