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
                create table if not exists products(
                    id serial primary key,
                    name varchar,
                    modified timestamp default now()
                );
                truncate table products;
                insert into products(id ,name) values(1, \'GITN\');
                insert into products(id, name) values(2, \'GSDZ\');

                create table if not exists equipments(
                    id serial primary key,
                    name varchar,
                    modified timestamp default now()
                );
                truncate table equipments;
                insert into equipments(id, name) values(1, \'radio\');
                insert into equipments(id, name) values(2, \'altimeter\');
                insert into equipments(id, name) values(3, \'airspeed indicator\');

                create table if not exists equipment_list(
                    product_id serial,
                    equipment_id serial
                );
                truncate table equipment_list;
                insert into equipment_list(product_id, equipment_id) values (1, 1);
                insert into equipment_list(product_id, equipment_id) values (1, 2);
                insert into equipment_list(product_id, equipment_id) values (1, 3);
                insert into equipment_list(product_id, equipment_id) values (2, 1);
                insert into equipment_list(product_id, equipment_id) values (2, 2);
            `,
            `
            select
                products.name,
                string_agg(equipments.name, ', ') as equipments
            from products, equipment_list, equipments
            where
                equipment_list.product_id = products.id
                and equipment_list.equipment_id = equipments.id
            group by products.name
            ;
            `
        ];
        execute(background, (rows, error)=>{
            expect(error).to.equal(undefined);

            expect(rows.length).to.equal(2)
            expect(rows[0].name).to.equal('GITN')
            expect(rows[1].name).to.equal('GSDZ')

            expect(rows[0].equipments).to.equal('radio, altimeter, airspeed indicator')
            expect(rows[1].equipments).to.equal('radio, altimeter')

            done();
        });
    });
});
