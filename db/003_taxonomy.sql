-- ALD 2026 — practice area silos.
-- Slugs are search-shaped ("family-lawyers", not "family-law") because that is
-- how Australians actually search. Old slugs are kept in `intent_terms` and the
-- redirects table so nothing that was indexed breaks.

-- Retire the old "-law" slugs by renaming them in place where a 1:1 match exists.
update practice_areas set slug = 'family-lawyers',          singular='Family Lawyer',           name='Family Lawyers'          where slug='family-law';
update practice_areas set slug = 'criminal-lawyers',        singular='Criminal Lawyer',         name='Criminal Lawyers'        where slug='criminal-law';
update practice_areas set slug = 'property-lawyers',        singular='Property Lawyer',         name='Property Lawyers'        where slug='property-law';
update practice_areas set slug = 'wills-estates-lawyers',   singular='Wills & Estates Lawyer',  name='Wills & Estates Lawyers' where slug='wills-estates';
update practice_areas set slug = 'employment-lawyers',      singular='Employment Lawyer',       name='Employment Lawyers'      where slug='employment-law';
update practice_areas set slug = 'commercial-lawyers',      singular='Commercial Lawyer',       name='Commercial Lawyers'      where slug='commercial-law';
update practice_areas set slug = 'immigration-lawyers',     singular='Immigration Lawyer',      name='Immigration Lawyers'     where slug='immigration-law';
update practice_areas set slug = 'personal-injury-lawyers', singular='Personal Injury Lawyer',  name='Personal Injury Lawyers' where slug='personal-injury';
update practice_areas set slug = 'ip-lawyers',              singular='IP Lawyer',               name='Intellectual Property Lawyers' where slug='intellectual-property';
update practice_areas set slug = 'tax-lawyers',             singular='Tax Lawyer',              name='Tax Lawyers'             where slug='tax-law';
update practice_areas set slug = 'planning-environment-lawyers', singular='Planning & Environment Lawyer', name='Planning & Environment Lawyers' where slug='environmental-law';
update practice_areas set slug = 'insolvency-lawyers',      singular='Insolvency Lawyer',       name='Bankruptcy & Insolvency Lawyers' where slug='debt-insolvency';
update practice_areas set slug = 'administrative-lawyers',  singular='Administrative Lawyer',   name='Administrative Lawyers'  where slug='administrative-law';
update practice_areas set slug = 'defamation-lawyers',      singular='Defamation Lawyer',       name='Defamation & Media Lawyers' where slug='media-defamation';
update practice_areas set slug = 'elder-lawyers',           singular='Elder Law Solicitor',     name='Elder Law Solicitors'    where slug='elder-law';
update practice_areas set slug = 'traffic-lawyers',         singular='Traffic Lawyer',          name='Traffic Lawyers'         where slug='traffic-law';
update practice_areas set slug = 'general-practice',        singular='Solicitor',               name='General Practice Solicitors' where slug='general-law';

insert into practice_areas (slug, name, singular, sort_order) values
  ('divorce-lawyers',            'Divorce Lawyers',                'Divorce Lawyer',              20),
  ('child-custody-lawyers',      'Child Custody Lawyers',          'Child Custody Lawyer',        21),
  ('conveyancers',               'Conveyancers',                   'Conveyancer',                 30),
  ('compensation-lawyers',       'Compensation Lawyers',           'Compensation Lawyer',         40),
  ('workers-compensation-lawyers','Workers Compensation Lawyers',   'Workers Compensation Lawyer', 41),
  ('medical-negligence-lawyers', 'Medical Negligence Lawyers',     'Medical Negligence Lawyer',   42),
  ('business-lawyers',           'Business Lawyers',               'Business Lawyer',             50),
  ('contract-lawyers',           'Contract Lawyers',               'Contract Lawyer',             51),
  ('litigation-lawyers',         'Litigation & Dispute Lawyers',   'Litigation Lawyer',           52),
  ('debt-recovery-lawyers',      'Debt Recovery Lawyers',          'Debt Recovery Lawyer',        53),
  ('construction-lawyers',       'Building & Construction Lawyers','Construction Lawyer',         54),
  ('franchise-lawyers',          'Franchise Lawyers',              'Franchise Lawyer',            55),
  ('tenancy-lawyers',            'Tenancy & Leasing Lawyers',      'Tenancy Lawyer',              56),
  ('estate-dispute-lawyers',     'Contesting a Will Lawyers',      'Estate Dispute Lawyer',       57),
  ('barristers',                 'Barristers',                     'Barrister',                   80),
  ('mediators',                  'Mediators & Arbitrators',        'Mediator',                    81),
  ('notary-public',              'Notary Public',                  'Notary Public',               82)
on conflict (slug) do nothing;

-- Tier 1 = the money silos that get their own hub, hero question and guide content.
update practice_areas set tier = 1 where slug in (
  'family-lawyers','divorce-lawyers','criminal-lawyers','traffic-lawyers','conveyancers',
  'property-lawyers','wills-estates-lawyers','personal-injury-lawyers','compensation-lawyers',
  'employment-lawyers','immigration-lawyers','commercial-lawyers','business-lawyers','litigation-lawyers'
);

update practice_areas set
  blurb = 'Separation, divorce, parenting arrangements and property settlements. Family lawyers help you reach an agreement without going to court where possible — and represent you when court is unavoidable.',
  hero_question = 'Separating, or sorting out custody?',
  intent_terms = array['family law','separation','divorce','custody','parenting orders','property settlement','de facto','consent orders','family-law']
where slug = 'family-lawyers';

update practice_areas set
  blurb = 'Charged with an offence, facing court, or applying for bail. Criminal lawyers protect your rights from the first police interview through to sentencing and appeals.',
  hero_question = 'Been charged, or facing court?',
  intent_terms = array['criminal law','criminal defence','assault','drug charges','bail','police interview','sentencing','criminal-law']
where slug = 'criminal-lawyers';

update practice_areas set
  blurb = 'Drink driving, licence suspensions, demerit point appeals and serious driving offences. A traffic lawyer can be the difference between keeping and losing your licence.',
  hero_question = 'At risk of losing your licence?',
  intent_terms = array['traffic law','drink driving','dui','drug driving','licence appeal','speeding','demerit points','traffic-law']
where slug = 'traffic-lawyers';

update practice_areas set
  blurb = 'Buying or selling property. Conveyancers handle contracts, searches, settlement and the transfer of title so the deal completes cleanly.',
  hero_question = 'Buying or selling a property?',
  intent_terms = array['conveyancing','settlement','section 32','contract of sale','property transfer','vendor statement']
where slug = 'conveyancers';

update practice_areas set
  blurb = 'Wills, powers of attorney, probate and estate administration — plus contesting or defending an estate when a will is disputed.',
  hero_question = 'Making a will, or dealing with an estate?',
  intent_terms = array['wills','estate','probate','power of attorney','executor','letters of administration','wills-estates']
where slug = 'wills-estates-lawyers';

update practice_areas set
  blurb = 'Injured in a car accident, at work, or in a public place. Personal injury lawyers pursue compensation, usually on a no win no fee basis.',
  hero_question = 'Injured and out of pocket?',
  intent_terms = array['personal injury','compensation','no win no fee','tac','ctp','public liability','car accident','personal-injury']
where slug = 'personal-injury-lawyers';

update practice_areas set
  blurb = 'Unfair dismissal, workplace bullying, underpayment, restraint of trade and employment contracts — for employees and employers.',
  hero_question = 'Problem at work?',
  intent_terms = array['employment law','unfair dismissal','fair work','workplace bullying','redundancy','underpayment','employment-law']
where slug = 'employment-lawyers';

update practice_areas set
  blurb = 'Visas, partner and skilled migration, citizenship, refusals, cancellations and AAT appeals.',
  hero_question = 'Visa problem or application?',
  intent_terms = array['immigration','visa','partner visa','skilled migration','citizenship','deportation','aat appeal','immigration-law']
where slug = 'immigration-lawyers';

update practice_areas set
  blurb = 'Company structures, shareholder agreements, buying or selling a business, commercial contracts and disputes.',
  hero_question = 'Buying, selling or structuring a business?',
  intent_terms = array['commercial law','business law','shareholder agreement','business sale','company structure','commercial-law']
where slug = 'commercial-lawyers';

update practice_areas set
  blurb = 'General legal practices handling everyday matters — the first call for most Australians who are not yet sure what kind of lawyer they need.',
  hero_question = 'Not sure what kind of lawyer you need?',
  intent_terms = array['solicitor','lawyer','legal advice','law firm','general-law']
where slug = 'general-practice';

update practice_areas set blurb = coalesce(blurb, name || ' across Australia. Compare firms by location, read profiles and contact the right practitioner directly.') where blurb is null;
update practice_areas set singular = coalesce(singular, name) where singular is null;
