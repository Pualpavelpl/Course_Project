INSERT INTO "Attribute" (
  "id",
  "name",
  "description",
  "type",
  "category",
  "is_builtin",
  "version",
  "created_at",
  "updated_at"
)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'First Name',
    'Candidate first name',
    'STRING',
    'PERSONAL_INFORMATION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Last Name',
    'Candidate last name',
    'STRING',
    'PERSONAL_INFORMATION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Location',
    'Candidate city and country',
    'STRING',
    'PERSONAL_INFORMATION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("name") DO NOTHING;

UPDATE "Attribute"
SET
  "type" = 'STRING',
  "category" = 'PERSONAL_INFORMATION',
  "is_builtin" = true,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "name" IN ('First Name', 'Last Name', 'Location');

INSERT INTO "Profile_attribute" (
  "id",
  "profile_id",
  "attribute_id",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  profile."id",
  attribute."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Profile" AS profile
CROSS JOIN "Attribute" AS attribute
WHERE attribute."name" IN ('First Name', 'Last Name', 'Location')
ON CONFLICT ("profile_id", "attribute_id") DO NOTHING;

UPDATE "Profile_attribute" AS target
SET
  "value" = SPLIT_PART(BTRIM(source."value"), ' ', 1),
  "updated_at" = CURRENT_TIMESTAMP
FROM "Profile_attribute" AS source
JOIN "Attribute" AS source_attribute
  ON source_attribute."id" = source."attribute_id"
JOIN "Attribute" AS target_attribute
  ON target_attribute."name" = 'First Name'
WHERE
  source_attribute."name" = 'Full name'
  AND target."profile_id" = source."profile_id"
  AND target."attribute_id" = target_attribute."id"
  AND source."value" IS NOT NULL
  AND BTRIM(source."value") <> ''
  AND (target."value" IS NULL OR BTRIM(target."value") = '');

UPDATE "Profile_attribute" AS target
SET
  "value" = CASE
    WHEN POSITION(' ' IN BTRIM(source."value")) > 0
      THEN BTRIM(
        SUBSTRING(
          BTRIM(source."value")
          FROM POSITION(' ' IN BTRIM(source."value")) + 1
        )
      )
    ELSE NULL
  END,
  "updated_at" = CURRENT_TIMESTAMP
FROM "Profile_attribute" AS source
JOIN "Attribute" AS source_attribute
  ON source_attribute."id" = source."attribute_id"
JOIN "Attribute" AS target_attribute
  ON target_attribute."name" = 'Last Name'
WHERE
  source_attribute."name" = 'Full name'
  AND target."profile_id" = source."profile_id"
  AND target."attribute_id" = target_attribute."id"
  AND source."value" IS NOT NULL
  AND BTRIM(source."value") <> ''
  AND (target."value" IS NULL OR BTRIM(target."value") = '');
