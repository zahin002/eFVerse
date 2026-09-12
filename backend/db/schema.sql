-- ============================================================
-- eFVerse Database DDL Schema (PostgreSQL / Supabase)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.league (
  leagueid SERIAL PRIMARY KEY,
  leaguename character varying NOT NULL UNIQUE,
  country character varying
);
CREATE TABLE public.nationality (
  nationalityid integer NOT NULL DEFAULT nextval('nationality_nationalityid_seq'::regclass),
  countryname character varying NOT NULL UNIQUE,
  CONSTRAINT nationality_pkey PRIMARY KEY (nationalityid)
);
CREATE TABLE public.club (
  clubid integer NOT NULL DEFAULT nextval('club_clubid_seq'::regclass),
  clubname character varying NOT NULL,
  leagueid integer NOT NULL,
  CONSTRAINT club_pkey PRIMARY KEY (clubid),
  CONSTRAINT club_leagueid_fkey FOREIGN KEY (leagueid) REFERENCES public.league(leagueid)
);
CREATE TABLE public.positions (
  positioncode character varying NOT NULL,
  rolegroup character varying NOT NULL,
  CONSTRAINT positions_pkey PRIMARY KEY (positioncode)
);
CREATE TABLE public.stattype (
  statname character varying NOT NULL,
  CONSTRAINT stattype_pkey PRIMARY KEY (statname)
);
CREATE TABLE public.formtype (
  formtypeid integer NOT NULL DEFAULT nextval('formtype_formtypeid_seq'::regclass),
  formname character varying NOT NULL UNIQUE,
  multiplier numeric NOT NULL CHECK (multiplier >= 0.50 AND multiplier <= 1.50),
  CONSTRAINT formtype_pkey PRIMARY KEY (formtypeid)
);
CREATE TABLE public.injurytype (
  injurytypeid integer NOT NULL DEFAULT nextval('injurytype_injurytypeid_seq'::regclass),
  injuryname character varying NOT NULL UNIQUE,
  defaultmultiplier numeric NOT NULL CHECK (defaultmultiplier >= 0.10 AND defaultmultiplier <= 1.00),
  CONSTRAINT injurytype_pkey PRIMARY KEY (injurytypeid)
);
CREATE TABLE public.trainingprogram (
  programid integer NOT NULL DEFAULT nextval('trainingprogram_programid_seq'::regclass),
  programname character varying NOT NULL UNIQUE,
  CONSTRAINT trainingprogram_pkey PRIMARY KEY (programid)
);
CREATE TABLE public.positionpenalty (
  fromposition character varying NOT NULL,
  toposition character varying NOT NULL,
  penalty integer NOT NULL,
  CONSTRAINT positionpenalty_pkey PRIMARY KEY (fromposition, toposition),
  CONSTRAINT positionpenalty_fromposition_fkey FOREIGN KEY (fromposition) REFERENCES public.positions(positioncode),
  CONSTRAINT positionpenalty_toposition_fkey FOREIGN KEY (toposition) REFERENCES public.positions(positioncode)
);
CREATE TABLE public.User (
  userid integer NOT NULL DEFAULT nextval('"User_userid_seq"'::regclass),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  passwordhash character varying NOT NULL,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  role text NOT NULL DEFAULT 'USER'::text CHECK (role = ANY (ARRAY['USER'::text, 'ADMIN'::text])),
  CONSTRAINT User_pkey PRIMARY KEY (userid)
);
CREATE TABLE public.player (
  playerid integer NOT NULL DEFAULT nextval('player_playerid_seq'::regclass),
  playername character varying NOT NULL,
  age integer CHECK (age >= 10 AND age <= 60),
  leagueid integer,
  clubid integer,
  nationalityid integer,
  CONSTRAINT player_pkey PRIMARY KEY (playerid),
  CONSTRAINT player_leagueid_fkey FOREIGN KEY (leagueid) REFERENCES public.league(leagueid),
  CONSTRAINT player_clubid_fkey FOREIGN KEY (clubid) REFERENCES public.club(clubid),
  CONSTRAINT player_nationalityid_fkey FOREIGN KEY (nationalityid) REFERENCES public.nationality(nationalityid)
);
CREATE TABLE public.manager (
  managerid integer NOT NULL DEFAULT nextval('manager_managerid_seq'::regclass),
  managername character varying NOT NULL,
  playstyle character varying NOT NULL CHECK (playstyle::text = ANY (ARRAY['Possession'::character varying, 'Long Ball Counter'::character varying, 'Quick Counter'::character varying, 'Long Ball'::character varying, 'Out Wide'::character varying]::text[])),
  leagueid integer,
  clubid integer,
  nationalityid integer,
  CONSTRAINT manager_pkey PRIMARY KEY (managerid),
  CONSTRAINT manager_leagueid_fkey FOREIGN KEY (leagueid) REFERENCES public.league(leagueid),
  CONSTRAINT manager_clubid_fkey FOREIGN KEY (clubid) REFERENCES public.club(clubid),
  CONSTRAINT manager_nationalityid_fkey FOREIGN KEY (nationalityid) REFERENCES public.nationality(nationalityid)
);
CREATE TABLE public.card (
  cardid integer NOT NULL DEFAULT nextval('card_cardid_seq'::regclass),
  playerid integer NOT NULL,
  cardtype text NOT NULL CHECK (cardtype = ANY (ARRAY['Normal'::text, 'Standard'::text, 'Featured'::text, 'Trending'::text, 'POTW'::text, 'Legend'::text, 'Legendary'::text, 'Epic'::text, 'Highlight'::text, 'Bigtime'::text, 'Big Time'::text, 'Showtime'::text, 'Show Time'::text])),
  positioncode character varying NOT NULL,
  baseoverallrating integer NOT NULL CHECK (baseoverallrating >= 0 AND baseoverallrating <= 100),
  currentoverallrating integer NOT NULL,
  maxoverallrating integer NOT NULL CHECK (maxoverallrating >= 0 AND maxoverallrating <= 100),
  totalprogressionpoints integer NOT NULL DEFAULT 64,
  CONSTRAINT card_pkey PRIMARY KEY (cardid),
  CONSTRAINT card_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(playerid),
  CONSTRAINT card_primaryposition_fkey FOREIGN KEY (positioncode) REFERENCES public.positions(positioncode),
  CONSTRAINT fk_card_position FOREIGN KEY (positioncode) REFERENCES public.positions(positioncode)
);
CREATE TABLE public.playerstats (
  statsid integer NOT NULL DEFAULT nextval('playerstats_statsid_seq'::regclass),
  cardid integer NOT NULL UNIQUE,
  offensiveawareness integer CHECK (offensiveawareness >= 0 AND offensiveawareness <= 100),
  finishing integer CHECK (finishing >= 0 AND finishing <= 100),
  ballcontrol integer CHECK (ballcontrol >= 0 AND ballcontrol <= 100),
  dribbling integer CHECK (dribbling >= 0 AND dribbling <= 100),
  passing integer CHECK (passing >= 0 AND passing <= 100),
  kickingpower integer CHECK (kickingpower >= 0 AND kickingpower <= 100),
  speed integer CHECK (speed >= 0 AND speed <= 100),
  acceleration integer CHECK (acceleration >= 0 AND acceleration <= 100),
  stamina integer CHECK (stamina >= 0 AND stamina <= 100),
  balance integer CHECK (balance >= 0 AND balance <= 100),
  physicalcontact integer CHECK (physicalcontact >= 0 AND physicalcontact <= 100),
  jump integer CHECK (jump >= 0 AND jump <= 100),
  defensiveawareness integer CHECK (defensiveawareness >= 0 AND defensiveawareness <= 100),
  tackling integer CHECK (tackling >= 0 AND tackling <= 100),
  aggression integer CHECK (aggression >= 0 AND aggression <= 100),
  gkawareness integer CHECK (gkawareness >= 0 AND gkawareness <= 100),
  gkcatching integer CHECK (gkcatching >= 0 AND gkcatching <= 100),
  gkparrying integer CHECK (gkparrying >= 0 AND gkparrying <= 100),
  gkreflexes integer CHECK (gkreflexes >= 0 AND gkreflexes <= 100),
  gkreach integer CHECK (gkreach >= 0 AND gkreach <= 100),
  CONSTRAINT playerstats_pkey PRIMARY KEY (statsid),
  CONSTRAINT playerstats_cardid_fkey FOREIGN KEY (cardid) REFERENCES public.card(cardid)
);
CREATE TABLE public.managereffect (
  managerid integer NOT NULL,
  statname character varying NOT NULL,
  boostvalue integer CHECK (boostvalue >= 1 AND boostvalue <= 3),
  CONSTRAINT managereffect_pkey PRIMARY KEY (managerid, statname),
  CONSTRAINT managereffect_managerid_fkey FOREIGN KEY (managerid) REFERENCES public.manager(managerid),
  CONSTRAINT managereffect_statname_fkey FOREIGN KEY (statname) REFERENCES public.stattype(statname)
);
CREATE TABLE public.playerform (
  formid integer NOT NULL DEFAULT nextval('playerform_formid_seq'::regclass),
  playerid integer NOT NULL,
  formtypeid integer NOT NULL,
  startdate date NOT NULL,
  enddate date,
  CONSTRAINT playerform_pkey PRIMARY KEY (formid),
  CONSTRAINT playerform_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(playerid),
  CONSTRAINT playerform_formtypeid_fkey FOREIGN KEY (formtypeid) REFERENCES public.formtype(formtypeid)
);
CREATE TABLE public.injuryrecord (
  injuryid integer NOT NULL DEFAULT nextval('injuryrecord_injuryid_seq'::regclass),
  playerid integer NOT NULL,
  injurytypeid integer NOT NULL,
  startdate date NOT NULL,
  enddate date,
  status character varying NOT NULL,
  CONSTRAINT injuryrecord_pkey PRIMARY KEY (injuryid),
  CONSTRAINT injuryrecord_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(playerid),
  CONSTRAINT injuryrecord_injurytypeid_fkey FOREIGN KEY (injurytypeid) REFERENCES public.injurytype(injurytypeid)
);
CREATE TABLE public.playermarketvalue (
  marketvalueid integer NOT NULL DEFAULT nextval('playermarketvalue_marketvalueid_seq'::regclass),
  playerid integer NOT NULL,
  basemarketvalue numeric NOT NULL,
  startdate date NOT NULL,
  enddate date,
  lastupdated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT playermarketvalue_pkey PRIMARY KEY (marketvalueid),
  CONSTRAINT playermarketvalue_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.player(playerid)
);
CREATE TABLE public.squad (
  squadid integer NOT NULL DEFAULT nextval('squad_squadid_seq'::regclass),
  userid integer NOT NULL,
  managerid integer NOT NULL,
  squadname character varying NOT NULL,
  teamstrength integer DEFAULT 0,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  isfavourite boolean DEFAULT false,
  formation character varying NOT NULL DEFAULT '4-3-3'::character varying CHECK (formation::text = ANY (ARRAY['4-3-3'::character varying, '4-4-2'::character varying, '4-2-3-1'::character varying, '3-5-2'::character varying, '5-3-2'::character varying, '4-1-4-1'::character varying, '3-4-3'::character varying, '4-5-1'::character varying, '5-2-3'::character varying, 'custom'::character varying]::text[])),
  CONSTRAINT squad_pkey PRIMARY KEY (squadid),
  CONSTRAINT squad_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid),
  CONSTRAINT squad_managerid_fkey FOREIGN KEY (managerid) REFERENCES public.manager(managerid)
);
CREATE TABLE public.squadplayer (
  squadid integer NOT NULL,
  cardid integer NOT NULL,
  assignedposition character varying NOT NULL,
  isstartingxi boolean DEFAULT false,
  effectiverating integer,
  CONSTRAINT squadplayer_pkey PRIMARY KEY (squadid, cardid),
  CONSTRAINT squadplayer_squadid_fkey FOREIGN KEY (squadid) REFERENCES public.squad(squadid),
  CONSTRAINT squadplayer_cardid_fkey FOREIGN KEY (cardid) REFERENCES public.card(cardid),
  CONSTRAINT squadplayer_assignedposition_fkey FOREIGN KEY (assignedposition) REFERENCES public.positions(positioncode)
);
CREATE TABLE public.review (
  reviewid integer NOT NULL DEFAULT nextval('review_reviewid_seq'::regclass),
  userid integer NOT NULL,
  cardid integer NOT NULL,
  matchesplayed integer NOT NULL,
  matcheswon integer NOT NULL,
  goals integer NOT NULL,
  assists integer NOT NULL,
  cleansheets integer NOT NULL,
  averagerating numeric CHECK (averagerating >= 0::numeric AND averagerating <= 10::numeric),
  lastupdated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_pkey PRIMARY KEY (reviewid),
  CONSTRAINT review_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid),
  CONSTRAINT review_cardid_fkey FOREIGN KEY (cardid) REFERENCES public.card(cardid)
);
CREATE TABLE public.progressionrule (
  programid integer NOT NULL,
  statname character varying NOT NULL,
  boostperpoint integer DEFAULT 1,
  CONSTRAINT progressionrule_pkey PRIMARY KEY (programid, statname),
  CONSTRAINT progressionrule_programid_fkey FOREIGN KEY (programid) REFERENCES public.trainingprogram(programid),
  CONSTRAINT progressionrule_statname_fkey FOREIGN KEY (statname) REFERENCES public.stattype(statname)
);
CREATE TABLE public.cardallocation (
  userid integer NOT NULL,
  cardid integer NOT NULL,
  programid integer NOT NULL,
  pointsallocated integer DEFAULT 0,
  CONSTRAINT cardallocation_pkey PRIMARY KEY (userid, cardid, programid),
  CONSTRAINT cardallocation_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid),
  CONSTRAINT cardallocation_cardid_fkey FOREIGN KEY (cardid) REFERENCES public.card(cardid),
  CONSTRAINT cardallocation_programid_fkey FOREIGN KEY (programid) REFERENCES public.trainingprogram(programid)
);
CREATE TABLE public.build (
  buildid integer NOT NULL DEFAULT nextval('build_buildid_seq'::regclass),
  userid integer NOT NULL,
  cardid integer NOT NULL,
  buildname character varying NOT NULL,
  ispublic boolean DEFAULT false,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT build_pkey PRIMARY KEY (buildid),
  CONSTRAINT build_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid),
  CONSTRAINT build_cardid_fkey FOREIGN KEY (cardid) REFERENCES public.card(cardid)
);
CREATE TABLE public.buildstats (
  buildid integer NOT NULL,
  offensiveawareness integer,
  finishing integer,
  ballcontrol integer,
  dribbling integer,
  passing integer,
  kickingpower integer,
  speed integer,
  acceleration integer,
  stamina integer,
  balance integer,
  physicalcontact integer,
  jump integer,
  defensiveawareness integer,
  tackling integer,
  aggression integer,
  gkawareness integer,
  gkcatching integer,
  gkparrying integer,
  gkreflexes integer,
  gkreach integer,
  CONSTRAINT buildstats_pkey PRIMARY KEY (buildid),
  CONSTRAINT buildstats_buildid_fkey FOREIGN KEY (buildid) REFERENCES public.build(buildid)
);
CREATE TABLE public.buildreaction (
  buildid integer NOT NULL,
  userid integer NOT NULL,
  reaction text NOT NULL CHECK (reaction = ANY (ARRAY['LIKE'::text, 'DISLIKE'::text])),
  CONSTRAINT buildreaction_pkey PRIMARY KEY (buildid, userid),
  CONSTRAINT buildreaction_buildid_fkey FOREIGN KEY (buildid) REFERENCES public.build(buildid),
  CONSTRAINT buildreaction_userid_fkey FOREIGN KEY (userid) REFERENCES public.User(userid)
);
CREATE TABLE public.player_deleted_audit (
  auditid integer NOT NULL DEFAULT nextval('player_deleted_audit_auditid_seq'::regclass),
  playerid integer,
  playername character varying,
  age integer,
  leagueid integer,
  clubid integer,
  nationalityid integer,
  deletedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT player_deleted_audit_pkey PRIMARY KEY (auditid)
);
CREATE TABLE public.manager_deleted_audit (
  auditid integer NOT NULL DEFAULT nextval('manager_deleted_audit_auditid_seq'::regclass),
  managerid integer,
  managername character varying,
  playstyle character varying,
  leagueid integer,
  clubid integer,
  nationalityid integer,
  deletedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT manager_deleted_audit_pkey PRIMARY KEY (auditid)
);

-- ============================================================
-- INITIAL REFERENCE SEED DATA: POSITIONS & STAT TYPES
-- ============================================================
INSERT INTO public.positions (positioncode, rolegroup) VALUES
('CF', 'FORWARD'), ('SS', 'FORWARD'), ('LWF', 'WINGER'), ('RWF', 'WINGER'),
('AMF', 'MIDFIELDER'), ('CMF', 'MIDFIELDER'), ('LMF', 'MIDFIELDER'), ('RMF', 'MIDFIELDER'), ('DMF', 'MIDFIELDER'),
('LB', 'DEFENDER'), ('RB', 'DEFENDER'), ('CB', 'DEFENDER'), ('GK', 'GOALKEEPER')
ON CONFLICT (positioncode) DO NOTHING;

INSERT INTO public.stattype (statname) VALUES
('OffensiveAwareness'), ('Finishing'), ('BallControl'), ('Dribbling'), ('Passing'),
('KickingPower'), ('Speed'), ('Acceleration'), ('Stamina'), ('Balance'),
('PhysicalContact'), ('Jump'), ('DefensiveAwareness'), ('Tackling'), ('Aggression'),
('GkAwareness'), ('GkCatching'), ('GkParrying'), ('GkReflexes'), ('GkReach')
ON CONFLICT (statname) DO NOTHING;

INSERT INTO public.formtype (formname, multiplier) VALUES
('Form A', 1.20), ('Form B', 1.10), ('Form C', 1.00), ('Form D', 0.90), ('Form E', 0.80)
ON CONFLICT (formname) DO NOTHING;

INSERT INTO public.injurytype (injuryname, defaultmultiplier) VALUES
('Low Injury', 0.90), ('Medium Injury', 0.75), ('High Injury', 0.50)
ON CONFLICT (injuryname) DO NOTHING;

INSERT INTO public.trainingprogram (programname) VALUES
('Shooting'), ('Passing'), ('Dribbling'), ('Dexterity'), ('Lower Body'), ('Aerial'), ('Defending'), ('GK 1'), ('GK 2'), ('GK 3')
ON CONFLICT (programname) DO NOTHING;

-- ============================================================
-- SEED DATA: OFFICIAL eFOOTBALL NATIONALITIES (150 COUNTRIES)
-- ============================================================
INSERT INTO public.nationality (countryname) VALUES
('Albania'), ('Algeria'), ('Andorra'), ('Angola'), ('Argentina'), ('Armenia'), ('Australia'), ('Austria'), ('Azerbaijan'),
('Bahrain'), ('Bangladesh'), ('Belarus'), ('Belgium'), ('Benin'), ('Bolivia'), ('Bosnia and Herzegovina'), ('Brazil'),
('Bulgaria'), ('Burkina Faso'), ('Burundi'), ('Cameroon'), ('Canada'), ('Cape Verde'), ('Central African Republic'),
('Chile'), ('China'), ('Colombia'), ('Comoros'), ('Congo'), ('Costa Rica'), ('Croatia'), ('Cuba'), ('Curacao'), ('Cyprus'),
('Czechia'), ('DR Congo'), ('Denmark'), ('Dominican Republic'), ('Ecuador'), ('Egypt'), ('El Salvador'), ('England'),
('Equatorial Guinea'), ('Estonia'), ('Faroe Islands'), ('Finland'), ('France'), ('Gabon'), ('Gambia'), ('Georgia'),
('Germany'), ('Ghana'), ('Greece'), ('Guatemala'), ('Guinea'), ('Guinea-Bissau'), ('Haiti'), ('Honduras'), ('Hungary'),
('Iceland'), ('India'), ('Indonesia'), ('Iran'), ('Iraq'), ('Israel'), ('Italy'), ('Ivory Coast'), ('Jamaica'), ('Japan'),
('Jordan'), ('Kazakhstan'), ('Kenya'), ('Kosovo'), ('Kuwait'), ('Kyrgyzstan'), ('Latvia'), ('Lebanon'), ('Liberia'),
('Libya'), ('Liechtenstein'), ('Lithuania'), ('Luxembourg'), ('Madagascar'), ('Malaysia'), ('Mali'), ('Malta'),
('Mauritania'), ('Mexico'), ('Moldova'), ('Montenegro'), ('Morocco'), ('Mozambique'), ('Namibia'), ('Nepal'),
('Netherlands'), ('New Zealand'), ('Nicaragua'), ('Niger'), ('Nigeria'), ('North Macedonia'), ('Northern Ireland'),
('Norway'), ('Oman'), ('Pakistan'), ('Palestine'), ('Panama'), ('Paraguay'), ('Peru'), ('Philippines'), ('Poland'),
('Portugal'), ('Qatar'), ('Republic of Ireland'), ('Romania'), ('San Marino'), ('Saudi Arabia'), ('Scotland'),
('Senegal'), ('Serbia'), ('Sierra Leone'), ('Singapore'), ('Slovakia'), ('Slovenia'), ('South Africa'), ('South Korea'),
('Spain'), ('Sudan'), ('Suriname'), ('Sweden'), ('Switzerland'), ('Syria'), ('Tajikistan'), ('Tanzania'), ('Thailand'),
('Togo'), ('Trinidad and Tobago'), ('Tunisia'), ('Turkey'), ('Turkmenistan'), ('Uganda'), ('Ukraine'),
('United Arab Emirates'), ('United States'), ('Uruguay'), ('Uzbekistan'), ('Venezuela'), ('Vietnam'), ('Wales'),
('Zambia'), ('Zimbabwe')
ON CONFLICT (countryname) DO NOTHING;