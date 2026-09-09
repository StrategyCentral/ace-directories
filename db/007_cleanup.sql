-- Data hygiene on the legacy import.
--
-- The old WordPress site had a bad find-and-replace applied to firm names
-- ("Lawyers" -> "Lawyersyers"), and its address builder emitted the unit/level
-- prefix even when the number was blank ("Level Collins Street", "Suite ,").
-- Slugs are deliberately left alone: they are what Google indexed.

-- 1. Duplicated name suffixes
update lawyers set full_name = regexp_replace(full_name, '(?i)yersyers', 'yers', 'g')
  where full_name ~ '(?i)yersyers';
update lawyers set full_name = regexp_replace(full_name, '(?i)(lawyers)\s*\1', '\1', 'g')
  where full_name ~* '(lawyers)\s*lawyers';

-- 2. Leading punctuation left over from sort hacks (".Lex Fori Lawyers")
update lawyers set full_name = ltrim(full_name, '.,- ')
  where full_name ~ '^[.,\-]';

-- 3. Addresses with an empty unit/level/suite number
update lawyers set
  full_address = nullif(btrim(regexp_replace(
    regexp_replace(full_address, '(?i)^(suite|level|unit|shop|floor)\s*,?\s*(?=[A-Z])', '', 'g'),
    '\s{2,}', ' ', 'g')), ''),
  address = nullif(btrim(regexp_replace(
    regexp_replace(coalesce(address, ''), '(?i)^(suite|level|unit|shop|floor)\s*,?\s*(?=[A-Z])', '', 'g'),
    '\s{2,}', ' ', 'g')), '')
where full_address ~* '^(suite|level|unit|shop|floor)\s*,?\s*[A-Z]'
   or address ~* '^(suite|level|unit|shop|floor)\s*,?\s*[A-Z]';

-- 4. Trailing punctuation and stray double spaces anywhere
update lawyers set
  full_address = btrim(regexp_replace(full_address, '\s{2,}', ' ', 'g'))

where full_address ~ '\s{2,}';

-- 5. Refresh the derived columns the cleanup touched
update lawyers set
  search_text = lower(coalesce(full_name,'') || ' ' || coalesce(suburb,'') || ' ' ||
                      coalesce(state,'') || ' ' || coalesce(array_to_string(practice_areas,' '),''));
