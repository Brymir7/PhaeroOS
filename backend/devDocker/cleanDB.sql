WITH RankedDuplicates AS (
    SELECT
        f.fdC_id,
        ROW_NUMBER() OVER (
            PARTITION BY f.description
            ORDER BY f.fdc_id 
        ) AS rn
    FROM
        food f
        LEFT JOIN foundation_food ff ON f.fdc_id = ff.fdc_id
    WHERE ff.fdc_id IS NULL
)
DELETE FROM food
WHERE fdc_id IN (
    SELECT fdc_id FROM RankedDuplicates WHERE rn > 2
);

UPDATE food
SET description = REGEXP_REPLACE(description, '\s*(\d+,\d+|\d+)\s*(g|ml|l|G|ML|L|STÜCK|KG|X|%|MONAT|PORTION|ST|PORTIONEN|GR|OZ|1X|FL)', '', 'gi');

DELETE FROM food
WHERE (LENGTH(description) - LENGTH(REPLACE(description, ' ', '')) + 1) > 7
AND NOT EXISTS (
  SELECT 1
  FROM foundation_food
  WHERE foundation_food.fdc_id = food.fdc_id
);
DELETE from food_nutrient fn
where not exists(
select 1 from food f where f.fdc_id = fn.fdc_id);

UPDATE food
SET description = UPPER(description)
