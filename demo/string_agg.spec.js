var expect = require('chai').expect;
var { execute } = require('../lib');

describe('string_agg', () => {

    beforeEach(()=>{
        process.env.PGUSER='postgres';
        process.env.PGDATABASE='postgres';
        process.env.PGHOST='localhost';
        process.env.PGPASSWORD='';
    });
    it('works as expected', (done) => {
        var background = [
            `
                drop table if exists planes;
                create table planes(
                    id serial primary key,
                    name varchar
                );
                insert into planes(id ,name) values(1, \'GITN\');
                insert into planes(id, name) values(2, \'GSDZ\');

                drop table if exists equipments;
                create table equipments(
                    id serial primary key,
                    name varchar
                );
                insert into equipments(id, name) values(1, \'radio\');
                insert into equipments(id, name) values(2, \'altimeter\');
                insert into equipments(id, name) values(3, \'gps\');

                drop table if exists equipment_list;
                create table equipment_list(
                    plane_id serial,
                    equipment_id serial
                );
                insert into equipment_list(plane_id, equipment_id) values (1, 1);
                insert into equipment_list(plane_id, equipment_id) values (1, 2);
                insert into equipment_list(plane_id, equipment_id) values (1, 3);
                insert into equipment_list(plane_id, equipment_id) values (2, 1);
                insert into equipment_list(plane_id, equipment_id) values (2, 2);
            `,
            `
                select
                    planes.name,
                    string_agg(equipments.name, ', ') as equipments
                from planes, equipment_list, equipments
                where
                    equipment_list.plane_id = planes.id
                    and equipment_list.equipment_id = equipments.id
                group by planes.name
            `
        ];
        execute(background, (rows, error)=>{
            expect(error).to.equal(null);
            expect(rows).to.deep.equal([
                { name:'GITN', equipments:'radio, altimeter, gps' },
                { name:'GSDZ', equipments:'radio, altimeter' }
            ])
            done();
        });
    });
});
