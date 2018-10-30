var expect = require('chai').expect;
var { execute } = require('../lib');
var fs = require('fs');

describe('Prime factors', () => {

    beforeEach((done)=>{
        process.env.PGUSER='postgres';
        process.env.PGDATABASE='postgres';
        process.env.PGHOST='localhost';
        process.env.PGPASSWORD='';
        execute(fs.readFileSync('./demo/prime.factors.sql').toString(), (rows, error)=>{
            expect(error).to.equal(undefined);
            done();
        });
    });
    var primeFactorsOf = function(number, done) {
        execute('select factor from prime_factors_of($1)', [number], (rows, error)=> {
            expect(error).to.equal(undefined);
            done(rows);
        });
    }
    it('can decompose 2', (done) => {
        primeFactorsOf(2, (factors)=>{ expect(factors).to.deep.equal([
                { factor:2 }
            ])
            done();
        });
    });
    it('can decompose 4', (done) => {
        primeFactorsOf(4, (factors)=>{ expect(factors).to.deep.equal([
                { factor:2 },
                { factor:2 }
            ])
            done();
        });
    });
    it('can decompose 300', (done) => {
        primeFactorsOf(300, (factors)=>{ expect(factors).to.deep.equal([
                { factor:2 },
                { factor:2 },
                { factor:3 },
                { factor:5 },
                { factor:5 },
            ])
            done();
        });
    });
});
