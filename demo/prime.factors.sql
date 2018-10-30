drop function if exists prime_factors_of(number integer);

create function prime_factors_of(number integer)
    returns table (factor integer) as
$$
    DECLARE
        candidate integer := 2;
    BEGIN
        CREATE TEMPORARY TABLE factors(factor integer);

        while number > 1 loop
            while number % candidate = 0 loop
                insert into factors(factor) values(candidate);
                number = number / candidate;
            end loop;
            candidate = candidate + 1;
        end loop;

        RETURN QUERY
            select * from factors;
    END;
$$ LANGUAGE plpgsql;
