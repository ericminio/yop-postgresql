var expect = require('chai').expect;
var { execute, executeSync } = require('../lib');

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
        execute('select * from unknown', [], (rows, error)=>{
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
    it('defaults error to null', (done)=>{
        execute('select current_user', [], (rows, error)=>{
            expect(error).to.equal(null);
            done();
        });
    });
    it('allows to use strings as statements', (done)=>{
        execute([
            'create table if not exists greatness(id int, name varchar)',
            'truncate table greatness',
            'insert into greatness(id, name) values(1, \'liberty\')',
            'select name from greatness'
        ], (rows)=>{
            expect(rows.length).to.equal(1);
            expect(rows[0].name).to.equal('liberty');
            done();
        });
    });
    it('stops after first error in collection', (done)=>{
        execute([
            'create table if not exists greatness(id int, name varchar)',
            'truncate table greatness',
            'create tableifnotexists greatness(id int, name varchar)',
            'insert into greatness(id, name) values(1, \'liberty\')',
            'select name from greatness'
        ], (rows, error)=>{
            expect(error.message).to.contain('syntax error at or near "tableifnotexists"');
            expect(rows).to.deep.equal([]);

            setTimeout(()=> {
                execute('select name from greatness', [], (rows)=>{
                    expect(rows).to.deep.equal([]);
                    done();
                });
            }, 300);
        });
    });
    it('accepts different formats in the same collection', (done)=>{
        var all = [
            'create table if not exists greatness(id int, name varchar)',
            'truncate table greatness',
            { sql: 'insert into greatness(id, name) values($1, $2)', params:[1, 'liberty'] },
            { sql: 'insert into greatness(id, name) values($1, $2)', params:[2, 'equality'] },
            { sql: 'insert into greatness(id, name) values($1, $2)', params:[3, 'fraternity'] },
            'select name from greatness'
        ];
        execute(all, (rows)=>{
            expect(rows.length).to.equal(3);
            expect(rows[2].name).to.equal('fraternity');
            done();
        });
    });
    it('stops also when first statement fails', (done)=>{
        execute([
            'create table if not exists greatness(id int, name varchar)',
            'truncate table greatness'
        ], (rows, error)=>{
            execute([
                'create tableifnotexists greatness(id int, name varchar)',
                'insert into greatness(id, name) values(1, \'liberty\')',
            ], (rows, error)=>{
                expect(rows).to.deep.equal([]);
                expect(error.message).to.contain('syntax error at or near "tableifnotexists"');

                setTimeout(()=> {
                    execute('select name from greatness', (rows)=>{
                        expect(rows).to.deep.equal([]);
                        done();
                    });
                }, 300);
            });
        });
    });
    it('accepts a single statement in the collection', (done) => {
        execute(['select current_user'], (rows)=>{
            expect(rows[0].current_user).to.equal('postgres');
            done();
        });
    });
    it('accepts a single statement without parameter', (done) => {
        execute('select current_user', (rows)=>{
            expect(rows[0].current_user).to.equal('postgres');
            done();
        });
    });
    describe('await syntax', ()=>{

        it('is welcomed for one statement', async ()=>{
            var rows = await executeSync('select current_user')

            expect(rows.length).to.equal(1)
            expect(rows[0].current_user).to.equal('postgres')
        })
        it('is welcomed for one statement with params', async ()=>{
            await executeSync('create table if not exists greatness(id int, name varchar)')
            await executeSync('truncate table greatness')
            await executeSync('insert into greatness(id, name) values($1, $2)', [1, 'liberty'])
            var rows = await executeSync('select name from greatness')

            expect(rows.length).to.equal(1)
            expect(rows[0].name).to.equal('liberty')
        })
        it('let error bubble', async ()=>{
            try {
                await executeSync('select * from unknown')
            }
            catch (error) {
                expect(error.message).to.equal('relation "unknown" does not exist')
            }
        })
        it('is welcomed with several statements', async ()=>{
            var all = [
                'create table if not exists greatness(id int, name varchar)',
                'truncate table greatness',
                { sql: 'insert into greatness(id, name) values($1, $2)', params:[1, 'liberty'] },
                { sql: 'insert into greatness(id, name) values($1, $2)', params:[2, 'equality'] },
                { sql: 'insert into greatness(id, name) values($1, $2)', params:[3, 'fraternity'] },
                'select name from greatness'
            ]
            var rows = await executeSync(all)

            expect(rows.length).to.equal(3)
            expect(rows[0].name).to.equal('liberty')
            expect(rows[1].name).to.equal('equality')
            expect(rows[2].name).to.equal('fraternity')
        })
    })
});
