-- Practice Areas Seed Data
INSERT INTO practice_areas (slug, name, description, sort_order) VALUES
('family-law',         'Family Law',           'Divorce, custody, property settlement, domestic agreements', 1),
('criminal-law',       'Criminal Law',          'Criminal defence, traffic offences, DUI, assault, drug charges', 2),
('property-law',       'Property Law',          'Conveyancing, settlements, disputes, tenancy law', 3),
('wills-estates',      'Wills & Estates',       'Will drafting, probate, estate administration, powers of attorney', 4),
('employment-law',     'Employment Law',        'Unfair dismissal, workplace disputes, contracts, discrimination', 5),
('personal-injury',    'Personal Injury',       'Compensation claims, workers comp, motor vehicle accidents', 6),
('commercial-law',     'Commercial Law',        'Business contracts, partnerships, mergers, commercial disputes', 7),
('immigration-law',    'Immigration Law',       'Visas, citizenship, refugee claims, deportation appeals', 8),
('intellectual-property', 'Intellectual Property', 'Patents, trademarks, copyright, trade secrets', 9),
('tax-law',            'Tax Law',               'Tax disputes, ATO negotiations, GST, tax planning', 10),
('traffic-law',        'Traffic Law',           'Speeding, DUI, licence suspensions, traffic offences', 11),
('debt-insolvency',    'Debt & Insolvency',     'Bankruptcy, debt recovery, business insolvency, liquidation', 12),
('elder-law',          'Elder Law',             'Powers of attorney, guardianship, aged care, retirement planning', 13),
('environmental-law',  'Environmental Law',     'Planning approvals, pollution, development law', 14),
('administrative-law', 'Administrative Law',    'Government decisions, appeals, judicial review, tribunals', 15),
('media-defamation',   'Media & Defamation',   'Defamation claims, privacy, media law, online content', 16),
('general-law',        'General Law',           'General legal practice', 99)
ON CONFLICT (slug) DO NOTHING;
