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
    -- 1. Jude Bellingham (Bigtime AMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Jude Bellingham', 21, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Real Madrid' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'England' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Bigtime', 'AMF', 87, 87, 99, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 87, 85, 87, 86, 87, 85, 84, 83, 88, 83, 84, 82, 78, 76, 82, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 2. Kylian Mbappe (Bigtime CF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Kylian Mbappe', 25, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'La Liga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Real Madrid' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'France' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Bigtime', 'CF', 87, 87, 99, 64)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 87, 88, 87, 87, 80, 86, 89, 89, 84, 85, 80, 81, 45, 42, 50, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 3. Ayyoub Bouaddi (Trending DMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Ayyoub Bouaddi', 17, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Ligue 1' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Lille' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Morocco' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Trending', 'DMF', 95, 95, 95, 0)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 74, 68, 84, 82, 86, 78, 79, 78, 85, 79, 81, 78, 84, 84, 83, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 4. Michael Olise (Trending AMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Michael Olise', 22, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Bundesliga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Bayern Munich' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'France' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Trending', 'AMF', 96, 96, 96, 0)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach)
    VALUES (v_card_id, 83, 82, 87, 87, 87, 84, 85, 86, 85, 87, 74, 72, 52, 50, 55, 40, 40, 40, 40, 40);

    -- ------------------------------------------------------------
    -- 5. Enzo Fernandez (Trending CMF)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid)
    VALUES ('Enzo Fernandez', 23, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Chelsea' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Argentina' LIMIT 1))
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints)
    VALUES (v_player_id, 'Trending', 'CMF', 96, 96, 96, 0)
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

    -- ------------------------------------------------------------
    -- 17. Edwin van der Sar (Bigtime GK)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid, height, weight, preferredfoot, playstyle, weakfootusage, weakfootaccuracy, formconsistency, armlength, shoulderwidth, necklength, chestmeasurement, necksize, shoulderheight, leglength, thighsize, waistsize, armsize, calfsize)
    VALUES ('Edwin van der Sar', 37, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Premier League' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Manchester United' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Netherlands' LIMIT 1),
        197, 84, 'Right', 'Attacking GK', 'Rarely', 'Medium', 'Unwavering', 7, 7, 8, 7, 6, 4, 11, 7, 4, 7, 7)
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints, gpcost, starrating, skills, comskills, tierbadge, livecondition, booster1, maxlevel, progressionpoints)
    VALUES (v_player_id, 'Bigtime', 'GK', 89, 89, 99, 58, 0, 5, ARRAY['GK Low Punt', 'GK High Punt', 'GK Long Throw', 'GK Penalty Saver'], ARRAY[]::text[], 'S+', 'B', 'Goalkeeping +3', 30, 58)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach, tightpossession, lowpass, loftedpass, heading, placekicking, curl, defensiveengagement)
    VALUES (v_card_id, 40, 40, 57, 50, 58, 66, 50, 47, 55, 48, 70, 67, 45, 44, 50, 83, 82, 85, 83, 82, 57, 58, 60, 44, 46, 49, 50);

    -- ------------------------------------------------------------
    -- 18. Gianluigi Buffon (Bigtime GK)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid, height, weight, preferredfoot, playstyle, weakfootusage, weakfootaccuracy, formconsistency, armlength, shoulderwidth, necklength, chestmeasurement, necksize, shoulderheight, leglength, thighsize, waistsize, armsize, calfsize)
    VALUES ('Gianluigi Buffon', 28, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Serie A' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Juventus' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Italy' LIMIT 1),
        192, 92, 'Right', 'Attacking GK', 'Rarely', 'Medium', 'Unwavering', 7, 11, 5, 7, 9, 5, 8, 9, 7, 10, 8)
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints, gpcost, starrating, skills, comskills, tierbadge, livecondition, booster1, maxlevel, progressionpoints)
    VALUES (v_player_id, 'Bigtime', 'GK', 91, 91, 99, 56, 0, 5, ARRAY['GK Low Punt', 'GK High Punt', 'GK Long Throw', 'GK Penalty Saver', 'Captaincy', 'Fighting Spirit', 'GK Directing Defence'], ARRAY['Early Crosser'], 'S+', 'B', 'Saving +4', 29, 56)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach, tightpossession, lowpass, loftedpass, heading, placekicking, curl, defensiveengagement)
    VALUES (v_card_id, 42, 42, 47, 46, 58, 69, 49, 47, 52, 52, 63, 70, 48, 44, 48, 86, 84, 84, 86, 85, 44, 58, 59, 49, 49, 48, 49);

    -- ------------------------------------------------------------
    -- 19. Manuel Neuer (Showtime GK)
    -- ------------------------------------------------------------
    INSERT INTO public.player (playername, age, leagueid, clubid, nationalityid, height, weight, preferredfoot, playstyle, weakfootusage, weakfootaccuracy, formconsistency, armlength, shoulderwidth, necklength, chestmeasurement, necksize, shoulderheight, leglength, thighsize, waistsize, armsize, calfsize)
    VALUES ('Manuel Neuer', 40, 
        (SELECT leagueid FROM public.league WHERE leaguename = 'Bundesliga' LIMIT 1),
        (SELECT clubid FROM public.club WHERE clubname = 'Bayern Munich' LIMIT 1),
        (SELECT nationalityid FROM public.nationality WHERE countryname = 'Germany' LIMIT 1),
        193, 93, 'Right', 'Attacking GK', 'Rarely', 'High', 'Unwavering', 9, 10, 8, 5, 6, 5, 11, 5, 5, 8, 6)
    RETURNING playerid INTO v_player_id;

    INSERT INTO public.card (playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, totalprogressionpoints, gpcost, starrating, skills, comskills, tierbadge, livecondition, booster1, booster2, maxlevel, progressionpoints)
    VALUES (v_player_id, 'Showtime', 'GK', 91, 91, 99, 54, 0, 5, ARRAY['Through Passing', 'One-touch Pass', 'Weighted Pass', 'Low Lofted Pass', 'GK Low Punt', 'GK Long Throw', 'GK Penalty Saver', 'Captaincy', 'Visionary Pass', 'GK Directing Defence'], ARRAY[]::text[], 'S+', 'B', 'Saving +3', 'Passing +3', 28, 54)
    RETURNING cardid INTO v_card_id;

    INSERT INTO public.playerstats (cardid, offensiveawareness, finishing, ballcontrol, dribbling, passing, kickingpower, speed, acceleration, stamina, balance, physicalcontact, jump, defensiveawareness, tackling, aggression, gkawareness, gkcatching, gkparrying, gkreflexes, gkreach, tightpossession, lowpass, loftedpass, heading, placekicking, curl, defensiveengagement)
    VALUES (v_card_id, 40, 40, 62, 64, 77, 80, 59, 56, 64, 57, 56, 59, 62, 60, 66, 86, 80, 83, 85, 86, 60, 77, 80, 55, 64, 64, 64);

END $$;
