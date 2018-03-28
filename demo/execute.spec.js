var expect = require('chai').expect;
var { execute } = require('..');

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
});