-- ============================================================
-- eFVerse Official eFootball Sample Cards & Stats Seed Script
-- Pure SQL File: Execute directly in Supabase SQL Editor
-- ============================================================

-- 1. SEED LEAGUES
INSERT INTO public.league (leaguename, country) VALUES
('La Liga', 'Spain'),
('Premier League', 'England'),
('Bundesliga', 'Germany'),
('Ligue 1', 'France'),
('Serie A', 'Italy'),
('Eredivisie', 'Netherlands')
ON CONFLICT (leaguename) DO NOTHING;

-- 2. SEED CLUBS
INSERT INTO public.club (clubname, leagueid) VALUES
('Real Madrid', (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1)),
('Manchester City', (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1)),
('Chelsea', (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1)),
('Bayern Munich', (SELECT leagueid FROM public.league WHERE leaguename = 'Bundesliga' LIMIT 1)),
('Lille', (SELECT leagueid FROM public.league WHERE leaguename = 'Ligue 1' LIMIT 1)),
('SC Freiburg', (SELECT leagueid FROM public.league WHERE leaguename = 'Bundesliga' LIMIT 1)),
('RCD Mallorca', (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1)),
('Bologna', (SELECT leagueid FROM public.league WHERE leaguename = 'Serie A' LIMIT 1)),
('AS Monaco', (SELECT leagueid FROM public.league WHERE leaguename = 'Ligue 1' LIMIT 1)),
('Nottingham Forest', (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1)),
('Sevilla', (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1)),
('Leicester City', (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1)),
('Paris Saint-Germain', (SELECT leagueid FROM public.league WHERE leaguename = 'Ligue 1' LIMIT 1)),
('Ajax', (SELECT leagueid FROM public.league WHERE leaguename = 'Eredivisie' LIMIT 1))
ON CONFLICT DO NOTHING;

-- 3. SEED PLAYERS, CARDS, AND PLAYER STATS
DO $$
DECLARE
    v_player_id INT;
    v_card_id INT;
BEGIN

    -- ------------------------------------------------------------
    -- 1. Jude Bellingham (Legendary AMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Jude Bellingham', 21, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Real Madrid' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'England' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Legendary', 'AMF', 87, 87, 99, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 87, 85, 87, 86, 87, 85, 84, 83, 88, 83, 84, 82, 78, 76, 82, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 2. Kylian Mbappe (Legendary CF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Kylian Mbappe', 25, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Real Madrid' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'France' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Legendary', 'CF', 87, 87, 99, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 87, 88, 87, 87, 80, 86, 89, 89, 84, 85, 80, 81, 45, 42, 50, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 3. Ayyoub Bouaddi (POTW DMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Ayyoub Bouaddi', 17, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Ligue 1' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Lille' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Morocco' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'POTW', 'DMF', 95, 95, 95, 0)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 74, 68, 84, 82, 86, 78, 79, 78, 85, 79, 81, 78, 84, 84, 83, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 4. Michael Olise (POTW AMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Michael Olise', 22, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Bundesliga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Bayern Munich' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'France' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'POTW', 'AMF', 96, 96, 96, 0)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 83, 82, 87, 87, 87, 84, 85, 86, 85, 87, 74, 72, 52, 50, 55, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 5. Enzo Fernandez (POTW CMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Enzo Fernandez', 23, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Chelsea' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Argentina' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'POTW', 'CMF', 96, 96, 96, 0)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 80, 78, 86, 84, 88, 85, 78, 77, 87, 80, 79, 75, 78, 77, 80, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 6. Ruben Dias (Standard CB)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Ruben Dias', 27, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Manchester City' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Portugal' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'CB', 83, 83, 93, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 55, 50, 72, 68, 76, 78, 74, 71, 82, 75, 84, 82, 83, 83, 84, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 7. Johan Manzambi (Standard AMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Johan Manzambi', 18, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Bundesliga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'SC Freiburg' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Switzerland' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'AMF', 85, 85, 94, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 81, 79, 85, 85, 85, 81, 83, 84, 84, 84, 73, 71, 50, 48, 52, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 8. Cyle Larin (Standard CF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Cyle Larin', 29, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'RCD Mallorca' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Canada' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'CF', 80, 80, 90, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 80, 80, 77, 76, 72, 80, 81, 80, 80, 77, 82, 80, 42, 40, 48, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 9. Dan Ndoye (Standard RMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Dan Ndoye', 23, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Serie A' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Bologna' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Switzerland' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'RMF', 81, 81, 91, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 78, 76, 81, 82, 81, 80, 82, 83, 82, 83, 75, 73, 55, 54, 58, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 10. Folarin Balogun (Standard CF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Folarin Balogun', 23, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Ligue 1' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'AS Monaco' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'United States' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'CF', 81, 81, 91, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 81, 81, 80, 80, 73, 80, 82, 82, 81, 81, 78, 79, 44, 41, 49, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 11. Anthony Elanga (Standard RWF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Anthony Elanga', 22, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Nottingham Forest' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Sweden' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'RWF', 81, 81, 91, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 78, 78, 80, 81, 75, 80, 84, 84, 82, 82, 72, 74, 46, 43, 50, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 12. Valentin Barco (Standard CMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Valentin Barco', 20, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Sevilla' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Argentina' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'CMF', 81, 81, 91, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 77, 73, 81, 81, 81, 79, 80, 81, 81, 84, 71, 70, 68, 67, 72, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 13. Bilal El Khannouss (Standard LWF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Bilal El Khannouss', 20, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Leicester City' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Morocco' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'LWF', 81, 81, 91, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 79, 78, 81, 82, 80, 78, 82, 82, 81, 84, 69, 68, 48, 46, 52, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 14. Renato Veiga (Standard CB)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Renato Veiga', 21, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Chelsea' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Portugal' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'CB', 82, 82, 92, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 62, 58, 75, 72, 78, 82, 76, 74, 82, 74, 83, 82, 82, 82, 83, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 15. Joao Neves (Standard CMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Joao Neves', 19, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Ligue 1' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Paris Saint-Germain' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Portugal' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'CMF', 85, 85, 95, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 81, 76, 85, 85, 85, 81, 81, 82, 86, 85, 78, 79, 82, 82, 83, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 16. Jorrel Hato (Standard LB)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Jorrel Hato', 18, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Eredivisie' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Ajax' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Netherlands' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Standard', 'LB', 81, 81, 91, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 70, 60, 78, 77, 79, 75, 80, 80, 82, 80, 81, 82, 81, 81, 80, 40, 40, 40, 40, 40);

END $$;
