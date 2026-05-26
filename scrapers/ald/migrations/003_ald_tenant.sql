-- Insert ALD tenant row
INSERT INTO tenants (slug, name, tenant_type, country, region, domain, status, brand_json)
VALUES (
  'ald',
  'Aussie Lawyer Directory',
  'lawyer_directory',
  'AU',
  'national',
  'aussielawyerdirectory.com.au',
  'building',
  '{
    "primaryColor": "#1a3a5c",
    "accentColor": "#c9a84c",
    "fontFamily": "Inter",
    "agentName": "Lexie",
    "agentPersona": "friendly_paralegal"
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = now();
