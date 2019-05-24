var expect = require('chai').expect;
var { execute } = require('../lib');

describe('triggers', () => {

    beforeEach(()=>{
        process.env.PGUSER='postgres';
        process.env.PGDATABASE='postgres';
        process.env.PGHOST='localhost';
        process.env.PGPASSWORD='';
    });
    it('just work as expected', (done) => {
        var background = [
            `
                create table if not exists products(
                    id serial primary key,
                    name varchar,
                    modified timestamp default now()
                );
                truncate table products;
                insert into products(name) values(\'plane\');

                create or replace function set_modified_to_now()
                returns trigger as $$
                begin
                    new.modified = now();
                    return new;
                end;
                $$ language 'plpgsql';

                drop trigger if exists products_modified_trigger on products;
                create trigger products_modified_trigger before update on products
                for each row execute procedure set_modified_to_now();
            `,
            'select modified from products;'
        ];
        execute(background, (rows, error)=>{
            expect(error).to.equal(null);
            var oldTimestamp = rows[0].modified;
            var change = [
                'update products set name=\'cessna\';',
                'select id, name, modified from products;'
            ];
            execute(change, (rows, error)=> {
                expect(error).to.equal(null);

                expect(rows[0].name).to.equal('cessna');
                var newTimestamp = rows[0].modified;
                expect(new Date(newTimestamp).getTime()).not.to.equal(new Date(oldTimestamp).getTime());
                done();
            });
        });
    });
});
