var expect = require('chai').expect;

describe('Mocha', () => {

    it('is ready', () => {
        console.log(process.env);
        expect(1+1).to.equal(2);
    });
});