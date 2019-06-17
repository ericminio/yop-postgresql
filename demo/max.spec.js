var expect = require('chai').expect;
var { execute } = require('../lib');

describe('max', () => {

    beforeEach(()=>{
        process.env.PGUSER='postgres';
        process.env.PGDATABASE='postgres';
        process.env.PGHOST='localhost';
        process.env.PGPASSWORD='';
    });
    it('works with dates', (done) => {
        var background = [
            `
                drop table if exists planes;
                create table planes(
                    id serial primary key,
                    name varchar
                );
                insert into planes(id ,name) values(1, \'GITN\');
                insert into planes(id, name) values(2, \'GSDZ\');

                drop table if exists maintenance;
                create table maintenance(
                    id serial primary key,
                    plane_id integer,
                    date timestamp
                );
                insert into maintenance(id, plane_id, date) values(1, 1, \'2019-05-22\');
                insert into maintenance(id, plane_id, date) values(2, 1, \'2019-05-20\');
                insert into maintenance(id, plane_id, date) values(3, 1, \'2019-05-19\');

                insert into maintenance(id, plane_id, date) values(4, 2, \'2019-05-12\');
                insert into maintenance(id, plane_id, date) values(5, 2, \'2019-05-14\');
            `,
            `
                select
                    planes.name,
                    max(date) as last_maintenance
                from planes, maintenance
                where
                    maintenance.plane_id = planes.id
                group by planes.name
                order by planes.name asc
            `
        ];
        execute(background, (err, rows)=>{
            expect(err).to.equal(null);
            expect(rows).to.deep.equal([
                { name:'GITN', last_maintenance:new Date(2019, 4, 22) },
                { name:'GSDZ', last_maintenance:new Date(2019, 4, 14) }
            ])
            done();
        });
    });
});
