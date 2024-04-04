CREATE SCHEMA phaero_food;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE phaero_food.food (fdc_id INT, description TEXT);

CREATE TABLE phaero_food.nutrient (id INT, name VARCHAR(128), unit_name VARCHAR(8));

CREATE TABLE phaero_food.food_nutrient (
    id INT,
    fdc_id INT,
    nutrient_id INT,
    amount FLOAT
);

CREATE TABLE phaero_food.branded_food (
    fdc_id INT,
    brand_owner TEXT,
    gtin_upc TEXT,
    serving_size FLOAT,
    serving_size_unit TEXT

);

CREATE TABLE phaero_food.fndss_ingredient_nutrient_value (
    ingredient_description TEXT,
    nutrient_id INT,
    amount FLOAT
);

CREATE TABLE phaero_food.food_portion (
    fdc_id INT,
    amount FLOAT,
    gram_weight FLOAT,
    portion_description TEXT
);

CREATE TABLE phaero_food.input_food (
    fdc_id INT,
    amount FLOAT,
    sr_description TEXT,
    gram_weight FLOAT
);
CREATE TABLE phaero_food.foundation_food (fdc_id INT, description TEXT);
CREATE TABLE phaero_food.german_foundation_food (fdc_id INT, description TEXT);
CREATE TABLE phaero_food.german_food (fdc_id INT, description TEXT);

CREATE TABLE phaero_food.survey_fndds_food (fdc_id INT, wweia_category_code TEXT);

CREATE TABLE phaero_food.userfoods(user_id INT, fdc_id INT, portion_size INT);
CREATE TABLE phaero_food.userrecommendations (
    name VARCHAR(128),
    unit_name VARCHAR(8),
    default_amount FLOAT
);

COPY phaero_food.food (fdc_id, description)
FROM
    '/cleaned/food.csv' WITH (FORMAT csv, HEADER);

COPY phaero_food.nutrient (id, name, unit_name)
FROM
    '/cleaned/nutrient.csv' WITH (FORMAT csv, HEADER);

COPY phaero_food.food_nutrient (id, fdc_id, nutrient_id, amount)
FROM
    '/cleaned/food_nutrient.csv' WITH (FORMAT csv, HEADER);

COPY phaero_food.branded_food (
    fdc_id,
    brand_owner,
        gtin_upc,
    serving_size,
    serving_size_unit

)
FROM
    '/cleaned/branded_food.csv' WITH (FORMAT csv, HEADER);

COPY phaero_food.fndss_ingredient_nutrient_value (ingredient_description, nutrient_id, amount)
FROM
    '/cleaned/fndss_ingredient_nutrient_value.csv' WITH (FORMAT csv, HEADER);

COPY phaero_food.food_portion (fdc_id,amount,gram_weight,portion_description)
FROM
    '/cleaned/food_portion.csv' WITH (FORMAT csv, HEADER);

COPY phaero_food.input_food (fdc_id, amount, sr_description, gram_weight)
FROM
    '/cleaned/input_food.csv' WITH (FORMAT csv, HEADER);

COPY phaero_food.survey_fndds_food (fdc_id, wweia_category_code)
FROM
    '/cleaned/survey_fndds_food.csv' WITH (FORMAT csv, HEADER);
COPY phaero_food.foundation_food (fdc_id, description)
FROM
    '/cleaned/foundation_food.csv' WITH (FORMAT csv, HEADER);
COPY phaero_food.german_foundation_food (fdc_id, description)
FROM
    '/cleaned/german_foundation_food.csv' WITH (FORMAT csv, HEADER);
COPY phaero_food.userrecommendations (name, unit_name, default_amount)
FROM
    '/cleaned/userrecommendations.csv' WITH (FORMAT csv, HEADER);
COPY phaero_food.german_food (fdc_id, description)
FROM
    '/cleaned/german_food.csv' WITH (FORMAT csv, HEADER);
CREATE INDEX IF NOT EXISTS food_semantic_index_description ON phaero_food.food USING GIN (description public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS german_food_semantic_index_description ON phaero_food.german_food USING GIN (description public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS foundation_food_semantic_index_description ON phaero_food.foundation_food USING GIN (description public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS foundation_food_german_semantic_index_description ON phaero_food.german_foundation_food USING GIN (description public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fts_food ON phaero_food.food USING gin (to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_fts_food_de ON phaero_food.food USING gin (to_tsvector('german', description));
CREATE INDEX IF NOT EXISTS idx_fts_german_food_en ON phaero_food.german_food USING gin (to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_fts_german_food ON phaero_food.german_food USING gin (to_tsvector('german', description));
CREATE INDEX IF NOT EXISTS idx_fts_german_foundation ON phaero_food.german_foundation_food USING gin (to_tsvector('german', description));
CREATE INDEX IF NOT EXISTS idx_fts_foundation ON phaero_food.foundation_food USING gin (to_tsvector('english', description));

DO $$
DECLARE max_id integer;

BEGIN -- Get the maximum fdc_id
SELECT
    MAX(fdc_id) INTO max_id
FROM
    phaero_food.food;

-- If there are no rows in the table, set max_id to default value
IF max_id IS NULL THEN max_id := 1;

END IF;

-- Create the sequence starting from max_id + 1
EXECUTE 'CREATE SEQUENCE food_fdc_id_seq START WITH ' || (max_id + 1);

END $$;

ALTER TABLE
    phaero_food.food
ALTER COLUMN
    fdc_id
SET
    DEFAULT nextval('food_fdc_id_seq');
CREATE INDEX nutrient_idx on phaero_food.food_nutrient (id);
CREATE INDEX food_nutrition_map_idx on phaero_food.food_nutrient (fdc_id);
