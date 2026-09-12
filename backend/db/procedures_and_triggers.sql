--SQL Editor--
---1---
CREATE OR REPLACE FUNCTION enforce_logical_base_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_base_ovr INT;
    v_role VARCHAR(20);
    v_calculated_raw_ovr INT;
BEGIN

    SELECT c.BaseOverallRating, UPPER(pos.RoleGroup)
    INTO v_base_ovr, v_role
    FROM Card c
    JOIN Positions pos ON c.PositionCode = pos.PositionCode
    WHERE c.CardID = NEW.CardID;

  
    IF v_role = 'FORWARD' OR v_role = 'WINGER' THEN
        v_calculated_raw_ovr := (NEW.Finishing * 0.35) + (NEW.OffensiveAwareness * 0.25) + (NEW.Speed * 0.20) + (NEW.Dribbling * 0.20);
        
    ELSIF v_role = 'MIDFIELDER' THEN
        v_calculated_raw_ovr := (NEW.Passing * 0.35) + (NEW.BallControl * 0.25) + (NEW.Dribbling * 0.20) + (NEW.Stamina * 0.20);
        
    ELSIF v_role = 'DEFENDER' THEN
        v_calculated_raw_ovr := (NEW.DefensiveAwareness * 0.35) + (NEW.Tackling * 0.35) + (NEW.PhysicalContact * 0.15) + (NEW.Aggression * 0.15);
        
    ELSIF v_role = 'GOALKEEPER' THEN
        v_calculated_raw_ovr := (NEW.GkAwareness * 0.20) + (NEW.GkCatching * 0.20) + (NEW.GkParrying * 0.20) + (NEW.GkReflexes * 0.20) + (NEW.GkReach * 0.20);
        
    ELSE
      
        v_calculated_raw_ovr := (NEW.OffensiveAwareness + NEW.Passing + NEW.DefensiveAwareness + NEW.Speed) / 4;
    END IF;

  
    IF v_calculated_raw_ovr > (v_base_ovr + 3) THEN
        RAISE EXCEPTION '❌ Illogical Stats Detected: These stats generate a Raw OVR of % for a Card with a Base OVR of %. Please lower the stats.', v_calculated_raw_ovr, v_base_ovr;
    END IF;

  
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_logical_stats ON PlayerStats;

CREATE TRIGGER trg_check_logical_stats
BEFORE INSERT OR UPDATE ON PlayerStats
FOR EACH ROW
EXECUTE FUNCTION enforce_logical_base_stats();

--2--
CREATE OR REPLACE PROCEDURE save_player_build_pro(
    p_user_id INT,
    p_card_id INT,
    p_shooting_pts INT DEFAULT 0,
    p_passing_pts INT DEFAULT 0,
    p_dribbling_pts INT DEFAULT 0,
    p_dexterity_pts INT DEFAULT 0,
    p_lower_body_pts INT DEFAULT 0,
    p_aerial_pts INT DEFAULT 0,
    p_defending_pts INT DEFAULT 0,
    p_gk1_pts INT DEFAULT 0,
    p_gk2_pts INT DEFAULT 0,
    p_gk3_pts INT DEFAULT 0
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_build_id INT;
BEGIN
   
    SELECT BuildID INTO v_build_id FROM Build 
    WHERE UserID = p_user_id AND CardID = p_card_id LIMIT 1;

    IF v_build_id IS NULL THEN
        INSERT INTO Build (UserID, CardID, BuildName, UpdatedAt)
        VALUES (p_user_id, p_card_id, 'My Custom Build', CURRENT_TIMESTAMP)
        RETURNING BuildID INTO v_build_id;
    ELSE
        UPDATE Build SET UpdatedAt = CURRENT_TIMESTAMP WHERE BuildID = v_build_id;
    END IF;

  
    INSERT INTO BuildStats (
        BuildID, 
        Finishing, Passing, BallControl, Dribbling, 
        OffensiveAwareness, Acceleration, Balance, 
        Speed, Stamina, KickingPower, 
        Jump, PhysicalContact, 
        DefensiveAwareness, Tackling, Aggression, 
        GkAwareness, GkCatching, GkParrying, GkReflexes, GkReach
    )
    SELECT 
        v_build_id,
        LEAST(ps.Finishing + p_shooting_pts, 100),
        LEAST(ps.Passing + p_passing_pts, 100),
        LEAST(ps.BallControl + p_dribbling_pts, 100),
        LEAST(ps.Dribbling + p_dribbling_pts, 100),
        LEAST(ps.OffensiveAwareness + p_dexterity_pts, 100),
        LEAST(ps.Acceleration + p_dexterity_pts, 100),
        LEAST(ps.Balance + p_dexterity_pts, 100),
        LEAST(ps.Speed + p_lower_body_pts, 100),
        LEAST(ps.Stamina + p_lower_body_pts, 100),
        LEAST(ps.KickingPower + p_shooting_pts + p_lower_body_pts, 100), -- Combined impact
        LEAST(ps.Jump + p_aerial_pts, 100),
        LEAST(ps.PhysicalContact + p_aerial_pts, 100),
        LEAST(ps.DefensiveAwareness + p_defending_pts, 100),
        LEAST(ps.Tackling + p_defending_pts, 100),
        LEAST(ps.Aggression + p_defending_pts, 100),
        LEAST(ps.GkAwareness + p_gk1_pts, 100),
        LEAST(ps.GkCatching + p_gk2_pts, 100),
        LEAST(ps.GkParrying + p_gk3_pts, 100),
        LEAST(ps.GkReflexes + p_gk1_pts + p_gk3_pts, 100), -- Combined impact
        LEAST(ps.GkReach + p_gk2_pts, 100)
    FROM PlayerStats ps
    WHERE ps.CardID = p_card_id
    ON CONFLICT (BuildID) DO UPDATE SET
        Finishing = EXCLUDED.Finishing,
        Passing = EXCLUDED.Passing,
        BallControl = EXCLUDED.BallControl,
        Dribbling = EXCLUDED.Dribbling,
        OffensiveAwareness = EXCLUDED.OffensiveAwareness,
        Acceleration = EXCLUDED.Acceleration,
        Balance = EXCLUDED.Balance,
        Speed = EXCLUDED.Speed,
        Stamina = EXCLUDED.Stamina,
        KickingPower = EXCLUDED.KickingPower,
        Jump = EXCLUDED.Jump,
        PhysicalContact = EXCLUDED.PhysicalContact,
        DefensiveAwareness = EXCLUDED.DefensiveAwareness,
        Tackling = EXCLUDED.Tackling,
        Aggression = EXCLUDED.Aggression,
        GkAwareness = EXCLUDED.GkAwareness,
        GkCatching = EXCLUDED.GkCatching,
        GkParrying = EXCLUDED.GkParrying,
        GkReflexes = EXCLUDED.GkReflexes,
        GkReach = EXCLUDED.GkReach;

END;
$$;

--3--
CREATE OR REPLACE PROCEDURE train_player_card_pro(
    p_card_id INT,
    p_shooting_pts INT DEFAULT 0,
    p_passing_pts INT DEFAULT 0,
    p_dribbling_pts INT DEFAULT 0,
    p_dexterity_pts INT DEFAULT 0,
    p_lower_body_pts INT DEFAULT 0,
    p_aerial_pts INT DEFAULT 0,
    p_defending_pts INT DEFAULT 0,
    p_gk1_pts INT DEFAULT 0,
    p_gk2_pts INT DEFAULT 0,
    p_gk3_pts INT DEFAULT 0
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_role_group VARCHAR(20);
    v_base_ovr INT;
    v_ovr_increase DECIMAL(5,2) := 0;
BEGIN
    
    SELECT pos.rolegroup, c.BaseOverallRating 
    INTO v_role_group, v_base_ovr
    FROM Card c
    JOIN Positions pos ON c.positioncode = pos.positioncode
    WHERE c.CardID = p_card_id;

   
    UPDATE PlayerStats
    SET 
        Finishing = LEAST(Finishing + p_shooting_pts, 100),
        Passing = LEAST(Passing + p_passing_pts, 100),
        BallControl = LEAST(BallControl + p_dribbling_pts, 100),
        Dribbling = LEAST(Dribbling + p_dribbling_pts, 100),
        OffensiveAwareness = LEAST(OffensiveAwareness + p_dexterity_pts, 100),
        Acceleration = LEAST(Acceleration + p_dexterity_pts, 100),
        Balance = LEAST(Balance + p_dexterity_pts, 100),
        Speed = LEAST(Speed + p_lower_body_pts, 100),
        Stamina = LEAST(Stamina + p_lower_body_pts, 100),
        KickingPower = LEAST(KickingPower + p_shooting_pts + p_lower_body_pts, 100),
        Jump = LEAST(Jump + p_aerial_pts, 100),
        PhysicalContact = LEAST(PhysicalContact + p_aerial_pts, 100),
        DefensiveAwareness = LEAST(DefensiveAwareness + p_defending_pts, 100),
        Tackling = LEAST(Tackling + p_defending_pts, 100),
        Aggression = LEAST(Aggression + p_defending_pts, 100),
        GkAwareness = LEAST(GkAwareness + p_gk1_pts, 100),
        GkReflexes = LEAST(GkReflexes + p_gk1_pts + p_gk3_pts, 100),
        GkCatching = LEAST(GkCatching + p_gk2_pts, 100),
        GkReach = LEAST(GkReach + p_gk2_pts, 100),
        GkParrying = LEAST(GkParrying + p_gk3_pts, 100)
    WHERE CardID = p_card_id;

    -- 3. Role-Wise Rating Logic
    CASE UPPER(v_role_group)
        WHEN 'FORWARD' THEN
            v_ovr_increase := (p_shooting_pts * 0.45) + (p_dexterity_pts * 0.3) + (p_dribbling_pts * 0.15) + (p_lower_body_pts * 0.1);
        WHEN 'WINGER' THEN
            v_ovr_increase := (p_dribbling_pts * 0.35) + (p_lower_body_pts * 0.3) + (p_passing_pts * 0.2) + (p_dexterity_pts * 0.15);
        WHEN 'MIDFIELDER' THEN
            v_ovr_increase := (p_passing_pts * 0.4) + (p_dribbling_pts * 0.25) + (p_defending_pts * 0.15) + (p_lower_body_pts * 0.2);
        WHEN 'DEFENDER' THEN
            v_ovr_increase := (p_defending_pts * 0.55) + (p_aerial_pts * 0.25) + (p_lower_body_pts * 0.1) + (p_dexterity_pts * 0.1);
        WHEN 'GOALKEEPER' THEN
            v_ovr_increase := (p_gk1_pts * 0.4) + (p_gk2_pts * 0.3) + (p_gk3_pts * 0.3);
        ELSE
            v_ovr_increase := (p_shooting_pts + p_passing_pts + p_defending_pts) * 0.1;
    END CASE;

    -- 4. Final OVR Update (capped by MaxOverallRating)
    UPDATE Card 
    SET CurrentOverallRating = LEAST(ROUND(v_base_ovr + v_ovr_increase), MaxOverallRating)
    WHERE CardID = p_card_id;

END;
$$;

--4--
CREATE OR REPLACE FUNCTION set_default_player_form()
RETURNS TRIGGER AS $$
BEGIN
    
    INSERT INTO PlayerForm (PlayerID, FormTypeID, StartDate)
    VALUES (
        NEW.PlayerID, 
        (SELECT FormTypeID FROM FormType WHERE FormName = 'C' LIMIT 1), 
        CURRENT_DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_default_form_on_signup
AFTER INSERT ON Player
FOR EACH ROW
EXECUTE FUNCTION set_default_player_form();

--5--
CREATE OR REPLACE FUNCTION find_similar_players(target_card_id INT)
RETURNS TABLE (
    ret_cardid INT,
    ret_playername VARCHAR,
    ret_cardtype TEXT,
    ret_positioncode VARCHAR, 
    ret_baseoverallrating INT,
    ret_statdifference DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH TargetCard AS (
        SELECT pos.RoleGroup, s.*
        FROM Card c
        JOIN Positions pos ON c.positioncode = pos.PositionCode 
        JOIN PlayerStats s ON c.CardID = s.CardID
        WHERE c.CardID = target_card_id
    )
    SELECT 
        c.CardID, 
        p.PlayerName, 
        c.CardType, 
        c.positioncode, 
        c.BaseOverallRating,
        SQRT(
            POWER(ts.OffensiveAwareness - s.OffensiveAwareness, 2) +
            POWER(ts.Finishing - s.Finishing, 2) +
            POWER(ts.BallControl - s.BallControl, 2) +
            POWER(ts.Dribbling - s.Dribbling, 2) +
            POWER(ts.Passing - s.Passing, 2) +
            POWER(ts.KickingPower - s.KickingPower, 2) +
            POWER(ts.Speed - s.Speed, 2) +
            POWER(ts.Acceleration - s.Acceleration, 2) +
            POWER(ts.Stamina - s.Stamina, 2) +
            POWER(ts.Balance - s.Balance, 2) +
            POWER(ts.PhysicalContact - s.PhysicalContact, 2) +
            POWER(ts.Jump - s.Jump, 2) +
            POWER(ts.DefensiveAwareness - s.DefensiveAwareness, 2) +
            POWER(ts.Tackling - s.Tackling, 2) +
            POWER(ts.Aggression - s.Aggression, 2) +
            POWER(ts.GkAwareness - s.GkAwareness, 2) +
            POWER(ts.GkCatching - s.GkCatching, 2) +
            POWER(ts.GkParrying - s.GkParrying, 2) +
            POWER(ts.GkReflexes - s.GkReflexes, 2) +
            POWER(ts.GkReach - s.GkReach, 2)
        ) AS statdifference
    FROM Card c
    JOIN Player p ON c.PlayerID = p.PlayerID
    JOIN Positions pos ON c.positioncode = pos.PositionCode 
    JOIN PlayerStats s ON c.CardID = s.CardID
    CROSS JOIN TargetCard ts
    WHERE pos.RoleGroup = ts.RoleGroup 
      AND c.CardID != target_card_id        
    ORDER BY statdifference ASC        
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

--6--
CREATE OR REPLACE PROCEDURE update_player_status_proc(
    p_player_id INT,
    p_form_id INT,
    p_injury_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Update old Form
    UPDATE PlayerForm 
    SET EndDate = CURRENT_DATE
    WHERE PlayerID = p_player_id AND EndDate IS NULL;

    -- 2. Insert new Form
    INSERT INTO PlayerForm (PlayerID, FormTypeID, StartDate)
    VALUES (p_player_id, p_form_id, CURRENT_DATE);

    -- 3. Update old Injury
    UPDATE InjuryRecord 
    SET EndDate = CURRENT_DATE, Status = 'Recovered'
    WHERE PlayerID = p_player_id AND Status = 'Active';

    -- 4. Insert new Injury 
    IF p_injury_id IS NOT NULL AND p_injury_id != 0 THEN
        INSERT INTO InjuryRecord (PlayerID, InjuryTypeID, StartDate, Status)
        VALUES (p_player_id, p_injury_id, CURRENT_DATE, 'Active');
    END IF;

    
    PERFORM update_player_valuation(p_player_id, p_form_id, p_injury_id);

 
END;
$$;

--7--
CREATE TABLE Manager_Deleted_Audit (
    AuditID SERIAL PRIMARY KEY,
    ManagerID INT,
    ManagerName VARCHAR(100),
    PlayStyle VARCHAR(50),
    LeagueID INT,
    ClubID INT,
    NationalityID INT,
    DeletedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE OR REPLACE FUNCTION log_manager_delete()
RETURNS TRIGGER AS $$
BEGIN
  
    INSERT INTO Manager_Deleted_Audit (
        ManagerID, 
        ManagerName, 
        PlayStyle, 
        LeagueID, 
        ClubID, 
        NationalityID
    )
    VALUES (
        OLD.ManagerID, 
        OLD.ManagerName, 
        OLD.PlayStyle, 
        OLD.LeagueID, 
        OLD.ClubID, 
        OLD.NationalityID
    );
    
    RETURN OLD; 
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_manager_delete
AFTER DELETE ON Manager
FOR EACH ROW
EXECUTE FUNCTION log_manager_delete();

--8--
CREATE TABLE Player_Deleted_Audit (
    AuditID SERIAL PRIMARY KEY,
    PlayerID INT,
    PlayerName VARCHAR(100),
    Age INT,
    LeagueID INT,
    ClubID INT,
    NationalityID INT,
    DeletedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_player_delete()
RETURNS TRIGGER AS $$
BEGIN
    
    INSERT INTO Player_Deleted_Audit (PlayerID, PlayerName, Age, LeagueID, ClubID, NationalityID)
    VALUES (OLD.PlayerID, OLD.PlayerName, OLD.Age, OLD.LeagueID, OLD.ClubID, OLD.NationalityID);
    
    RETURN OLD; 
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_player_delete
AFTER DELETE ON Player
FOR EACH ROW
EXECUTE FUNCTION log_player_delete();


--9--
CREATE OR REPLACE FUNCTION get_effective_rating(p_card_id INT, p_target_position VARCHAR)
RETURNS INT AS $$
DECLARE
    v_natural_pos VARCHAR(10);
    v_current_rating INT;
    v_penalty INT := 0;
BEGIN
    
    SELECT "PositionCode", "CurrentOverallRating"
    INTO v_natural_pos, v_current_rating
    FROM card
    WHERE "CardID" = p_card_id;

   
    IF v_natural_pos = p_target_position THEN
        RETURN v_current_rating;
    END IF;

  
    SELECT "Penalty" INTO v_penalty
    FROM positionpenalty
    WHERE "FromPosition" = v_natural_pos AND "ToPosition" = p_target_position;

   
    IF v_penalty IS NULL THEN
        v_penalty := 0; 
    END IF;

   
    RETURN GREATEST(0, v_current_rating - v_penalty);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trigger_set_effective_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and set effective rating before insert/update
    NEW."EffectiveRating" := get_effective_rating(NEW."CardID", NEW."AssignedPosition");
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



--10--
CREATE OR REPLACE FUNCTION check_manager_boost_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN 
    SELECT COUNT(*) INTO current_count
    FROM ManagerEffect
    WHERE ManagerID = NEW.ManagerID;


    IF current_count >= 2 THEN
        RAISE EXCEPTION 'Limit Reached: Manager % cannot have more than 2 boosts.', NEW.ManagerID;
    END IF;


    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_limit_manager_boosts
BEFORE INSERT ON ManagerEffect
FOR EACH ROW
EXECUTE FUNCTION check_manager_boost_limit();

--11--
CREATE OR REPLACE FUNCTION update_player_valuation(
    p_player_id INT,
    p_form_type_id INT,
    p_injury_type_id INT 
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_anchor_value DECIMAL(15,2); 
    v_form_mult DECIMAL(4,2);
    v_injury_mult DECIMAL(4,2);
    v_new_value DECIMAL(15,2);
BEGIN

    SELECT BaseMarketValue INTO v_anchor_value 
    FROM PlayerMarketValue 
    WHERE PlayerID = p_player_id 
    ORDER BY StartDate ASC, LastUpdated ASC 
    LIMIT 1;

  
    IF v_anchor_value IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Player has no initial market value.');
    END IF;

    
    SELECT Multiplier INTO v_form_mult 
    FROM FormType WHERE FormTypeID = p_form_type_id;
    
   
    IF v_form_mult IS NULL THEN v_form_mult := 1.0; END IF;

    
    IF p_injury_type_id IS NOT NULL THEN
        SELECT DefaultMultiplier INTO v_injury_mult 
        FROM InjuryType WHERE InjuryTypeID = p_injury_type_id;
        IF v_injury_mult IS NULL THEN v_injury_mult := 1.0; END IF;
    ELSE
        v_injury_mult := 1.0;
    END IF;

  
    v_new_value := v_anchor_value * v_form_mult * v_injury_mult;

   
    INSERT INTO PlayerMarketValue (PlayerID, BaseMarketValue, StartDate)
    VALUES (p_player_id, v_new_value, CURRENT_DATE);

 
    RETURN json_build_object(
        'status', 'success',
        'anchor_value', v_anchor_value,
        'new_value', v_new_value,
        'multipliers', json_build_object(
            'form', v_form_mult,
            'injury', v_injury_mult
        )
    );
END;
$$;

--12--
CREATE OR REPLACE FUNCTION insert_manager_sql(
    p_name VARCHAR,
    p_playstyle VARCHAR,
    p_league_id INT,
    p_club_id INT,
    p_nationality_id INT
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    new_id INT;
BEGIN
    INSERT INTO Manager (ManagerName, PlayStyle, LeagueID, ClubID, NationalityID)
    VALUES (p_name, p_playstyle, p_league_id, p_club_id, p_nationality_id)
    RETURNING ManagerID INTO new_id;
    
    RETURN json_build_object('message', 'Manager added via SQL!', 'id', new_id);
END;
$$;

--13--
CREATE OR REPLACE FUNCTION smart_search_pro(
   
    p_name TEXT DEFAULT NULL,
    p_league_id INT DEFAULT NULL,
    p_club_id INT DEFAULT NULL,
    p_nation_id INT DEFAULT NULL,
    p_card_type TEXT DEFAULT NULL,
    p_pos_code VARCHAR DEFAULT NULL,
  
    p_off_aware INT DEFAULT NULL, p_finishing INT DEFAULT NULL, 
    p_ball_ctrl INT DEFAULT NULL, p_dribbling INT DEFAULT NULL, 
    p_passing INT DEFAULT NULL, p_kick_pwr INT DEFAULT NULL, 
    p_speed INT DEFAULT NULL, p_accel INT DEFAULT NULL, 
    p_stamina INT DEFAULT NULL, p_balance INT DEFAULT NULL, 
    p_phys_cont INT DEFAULT NULL, p_jump INT DEFAULT NULL, 
    p_def_aware INT DEFAULT NULL, p_tackling INT DEFAULT NULL, 
    p_aggression INT DEFAULT NULL, p_gk_aware INT DEFAULT NULL, 
    p_gk_catch INT DEFAULT NULL, p_gk_parry INT DEFAULT NULL, 
    p_gk_reflex INT DEFAULT NULL, p_gk_reach INT DEFAULT NULL
)
RETURNS TABLE (
    CardID INT, PlayerID INT, PlayerName VARCHAR, PositionCode VARCHAR, CardType TEXT, 
    LeagueName VARCHAR, ClubName VARCHAR, CountryName VARCHAR,
    BaseRating INT, Finishing INT, Speed INT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.CardID, p.PlayerID, p.PlayerName, c.PositionCode, c.CardType, 
        l.LeagueName, cl.ClubName, n.CountryName,
        c.BaseOverallRating, s.Finishing, s.Speed
    FROM Card c
    JOIN Player p ON c.PlayerID = p.PlayerID
    LEFT JOIN League l ON p.LeagueID = l.LeagueID
    LEFT JOIN Club cl ON p.ClubID = cl.ClubID
    LEFT JOIN Nationality n ON p.NationalityID = n.NationalityID
    LEFT JOIN PlayerStats s ON c.CardID = s.CardID
    WHERE 
        
        (p_name IS NULL OR p_name = '' OR p.PlayerName ILIKE '%' || p_name || '%')
        
        
        AND (p_league_id IS NULL OR p.LeagueID = p_league_id)
        AND (p_club_id IS NULL OR p.ClubID = p_club_id)
        AND (p_nation_id IS NULL OR p.NationalityID = p_nation_id)
        
      
        AND (p_card_type IS NULL OR p_card_type = '' 
             OR c.CardType ILIKE p_card_type 
             OR (p_card_type ILIKE 'Normal' AND c.CardType IN ('Normal', 'Standard')) 
             OR (p_card_type ILIKE 'Standard' AND c.CardType IN ('Normal', 'Standard')) 
             OR (p_card_type ILIKE 'Trending' AND c.CardType IN ('Trending', 'POTW')) 
             OR (p_card_type ILIKE 'POTW' AND c.CardType IN ('Trending', 'POTW')) 
             OR (p_card_type ILIKE 'Legend%' AND c.CardType ILIKE 'Legend%') 
             OR (p_card_type ILIKE 'Big%' AND c.CardType ILIKE 'Big%') 
             OR (p_card_type ILIKE 'Show%' AND c.CardType ILIKE 'Show%'))
        AND (p_pos_code IS NULL OR p_pos_code = '' OR c.PositionCode = p_pos_code)

        AND (p_off_aware IS NULL OR s.OffensiveAwareness >= p_off_aware)
        AND (p_finishing IS NULL OR s.Finishing >= p_finishing)
        AND (p_ball_ctrl IS NULL OR s.BallControl >= p_ball_ctrl)
        AND (p_dribbling IS NULL OR s.Dribbling >= p_dribbling)
        AND (p_passing IS NULL OR s.Passing >= p_passing)
        AND (p_kick_pwr IS NULL OR s.KickingPower >= p_kick_pwr)
        AND (p_speed IS NULL OR s.Speed >= p_speed)
        AND (p_accel IS NULL OR s.Acceleration >= p_accel)
        AND (p_stamina IS NULL OR s.Stamina >= p_stamina)
        AND (p_balance IS NULL OR s.Balance >= p_balance)
        AND (p_phys_cont IS NULL OR s.PhysicalContact >= p_phys_cont)
        AND (p_jump IS NULL OR s.Jump >= p_jump)
        AND (p_def_aware IS NULL OR s.DefensiveAwareness >= p_def_aware)
        AND (p_tackling IS NULL OR s.Tackling >= p_tackling)
        AND (p_aggression IS NULL OR s.Aggression >= p_aggression)
        AND (p_gk_aware IS NULL OR s.GkAwareness >= p_gk_aware)
        AND (p_gk_catch IS NULL OR s.GkCatching >= p_gk_catch)
        AND (p_gk_parry IS NULL OR s.GkParrying >= p_gk_parry)
        AND (p_gk_reflex IS NULL OR s.GkReflexes >= p_gk_reflex)
        AND (p_gk_reach IS NULL OR s.GkReach >= p_gk_reach);
END;
$$;


--14--
CREATE OR REPLACE FUNCTION calculate_suggested_stats(p_card_id INT)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_base INT;
    v_role VARCHAR; 
    v_stats json;
    
    
    calc_high INT; -- Key stats for the role
    calc_med  INT; -- Secondary stats
    calc_low  INT; -- Tertiary stats
    calc_weak INT; -- Irrelevant stats
    calc_null INT := 40; 
BEGIN
    SELECT c.BaseOverallRating, UPPER(pos.RoleGroup)
    INTO v_base, v_role
    FROM Card c
    JOIN Positions pos ON c.PositionCode = pos.PositionCode
    WHERE c.CardID = p_card_id;

    IF v_base IS NULL THEN
        RETURN json_build_object('error', 'Card or Position Role not found');
    END IF;

    
    
    calc_high := LEAST(99, v_base + 2);   
    calc_med  := LEAST(99, v_base - 1);   
    calc_low  := LEAST(99, v_base - 10);  
    calc_weak := GREATEST(40, v_base - 25); 

    
    IF v_role = 'FORWARD' THEN
        v_stats := json_build_object(
            'offensiveawareness', calc_high, 'finishing', calc_high, 'ballcontrol', calc_med,
            'dribbling', calc_med, 'passing', calc_low, 'kickingpower', calc_med,
            'speed', calc_high, 'acceleration', calc_high, 'stamina', calc_low,
            'balance', calc_med, 'physicalcontact', calc_low, 'jump', calc_low,
            'defensiveawareness', calc_weak, 'tackling', calc_weak, 'aggression', calc_weak,
            'gkawareness', calc_null, 'gkcatching', calc_null, 'gkparrying', calc_null, 'gkreflexes', calc_null, 'gkreach', calc_null
        );
        
    ELSIF v_role = 'MIDFIELDER' THEN
        v_stats := json_build_object(
            'offensiveawareness', calc_low, 'finishing', calc_weak, 'ballcontrol', calc_high,
            'dribbling', calc_high, 'passing', calc_high, 'kickingpower', calc_low,
            'speed', calc_med, 'acceleration', calc_med, 'stamina', calc_high,
            'balance', calc_med, 'physicalcontact', calc_low, 'jump', calc_low,
            'defensiveawareness', calc_med, 'tackling', calc_med, 'aggression', calc_low,
            'gkawareness', calc_null, 'gkcatching', calc_null, 'gkparrying', calc_null, 'gkreflexes', calc_null, 'gkreach', calc_null
        );

    ELSIF v_role = 'DEFENDER' THEN
        v_stats := json_build_object(
            'offensiveawareness', calc_weak, 'finishing', calc_weak, 'ballcontrol', calc_weak,
            'dribbling', calc_weak, 'passing', calc_low, 'kickingpower', calc_weak,
            'speed', calc_med, 'acceleration', calc_med, 'stamina', calc_med,
            'balance', calc_low, 'physicalcontact', calc_high, 'jump', calc_high,
            'defensiveawareness', calc_high, 'tackling', calc_high, 'aggression', calc_high,
            'gkawareness', calc_null, 'gkcatching', calc_null, 'gkparrying', calc_null, 'gkreflexes', calc_null, 'gkreach', calc_null
        );

    ELSIF v_role = 'GOALKEEPER' THEN
      
        v_stats := json_build_object(
            'offensiveawareness', 40, 'finishing', 40, 'ballcontrol', 40,
            'dribbling', 40, 'passing', 50, 'kickingpower', 60,
            'speed', 50, 'acceleration', 50, 'stamina', 50,
            'balance', 40, 'physicalcontact', calc_med, 'jump', calc_med,
            'defensiveawareness', 40, 'tackling', 40, 'aggression', 40,
            'gkawareness', calc_med, 'gkcatching', calc_med, 'gkparrying', calc_med, 'gkreflexes', calc_med, 'gkreach', calc_med
        );
    ELSE
        v_stats := json_build_object('error', 'RoleGroup ' || v_role || ' unknown');
    END IF;

    RETURN v_stats;
END;
$$;
DROP FUNCTION IF EXISTS calculate_suggested_stats(INT);

--15--

CREATE OR REPLACE FUNCTION insert_player_sql(
    p_name VARCHAR,
    p_age INT,
    p_nationality_id INT,
    p_club_id INT,
    p_league_id INT
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    new_id INT;
BEGIN
    INSERT INTO Player (PlayerName, Age, NationalityID, ClubID, LeagueID)
    VALUES (p_name, p_age, p_nationality_id, p_club_id, p_league_id)
    RETURNING PlayerID INTO new_id;
    
    RETURN json_build_object('message', 'Player added!', 'id', new_id);
END;
$$;
DROP FUNCTION IF EXISTS insert_player_sql;

CREATE OR REPLACE FUNCTION insert_card_sql(
    p_player_id INT,
    p_type VARCHAR,
    p_position_code VARCHAR, 
    p_base_rating INT,
    p_current_rating INT,
    p_max_rating INT
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    new_card_id INT;
BEGIN
    
    INSERT INTO Card (PlayerID, CardType, PositionCode, BaseOverallRating, CurrentOverallRating, MaxOverallRating)
    VALUES (p_player_id, p_type, p_position_code, p_base_rating, p_current_rating, p_max_rating)
    RETURNING CardID INTO new_card_id;

    RETURN json_build_object('message', 'Card created via SQL!', 'id', new_card_id);
END;
$$;


CREATE OR REPLACE FUNCTION insert_stats_sql(
    p_cardid INT,
    p_off_aware INT, p_finishing INT, p_ball_ctrl INT, p_dribbling INT, p_passing INT, 
    p_kick_pwr INT, p_speed INT, p_accel INT, p_stamina INT, p_balance INT, 
    p_phys_contact INT, p_jump INT, p_def_aware INT, p_tackling INT, p_aggression INT, 
    p_gk_aware INT, p_gk_catch INT, p_gk_parry INT, p_gk_reflex INT, p_gk_reach INT
)
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO PlayerStats (
        CardID, OffensiveAwareness, Finishing, BallControl, Dribbling, Passing, 
        KickingPower, Speed, Acceleration, Stamina, Balance, PhysicalContact, Jump, 
        DefensiveAwareness, Tackling, Aggression, 
        GKAwareness, GKCatching, GKParrying, GKReflexes, GKReach
    ) VALUES (
        p_cardid, p_off_aware, p_finishing, p_ball_ctrl, p_dribbling, p_passing, 
        p_kick_pwr, p_speed, p_accel, p_stamina, p_balance, p_phys_contact, p_jump, 
        p_def_aware, p_tackling, p_aggression, 
        p_gk_aware, p_gk_catch, p_gk_parry, p_gk_reflex, p_gk_reach
    );
    
    RETURN json_build_object('message', 'Stats saved via SQL!');
END;
$$;

--16--
INSERT INTO League (LeagueName, Country) VALUES
('Premier League', 'England'),
('La Liga', 'Spain'),
('Serie A', 'Italy'),
('Bundesliga', 'Germany'),
('Ligue 1', 'France'),
('Eredivisie', 'Netherlands'),
('Portuguese Liga', 'Portugal'),
('Russian Premier League', 'Russia'),
('MLS', 'United States'),
('Saudi Pro League', 'Saudi Arabia'),
('Chinese Super League', 'China'),
('Japanese J-League', 'Japan'),
('Argentine Primera División', 'Argentina'),
('Brazilian Série A', 'Brazil');


INSERT INTO Nationality (CountryName) VALUES
('England'),('Spain'),('Italy'),('Germany'),('France'),('Brazil'),
('Argentina'),('Portugal'),('Netherlands'),('Belgium'),('Poland'),
('Senegal'),('Uruguay'),('Croatia'),('Egypt'),('Nigeria'),
('Georgia'),('Morocco'),('Scotland'),('Algeria'),('Sweden'),
('Slovenia'),('Norway'),('Germany'),('Canada')
ON CONFLICT (CountryName) DO NOTHING;



-- Premier League
INSERT INTO Club (ClubName, LeagueID) VALUES
('Manchester United', 1),
('Manchester City', 1),
('Liverpool', 1),
('Chelsea', 1),
('Arsenal', 1),
('Tottenham Hotspur', 1),
('Newcastle United', 1),
('Brighton & Hove Albion', 1),
('Aston Villa', 1);

-- La Liga
INSERT INTO Club (ClubName, LeagueID) VALUES
('Real Madrid', 2),
('FC Barcelona', 2),
('Atlético Madrid', 2);

-- Serie A
INSERT INTO Club (ClubName, LeagueID) VALUES
('Juventus', 3),
('AC Milan', 3),
('Inter Milan', 3),
('AS Roma', 3),
('Napoli', 3);

-- Bundesliga
INSERT INTO Club (ClubName, LeagueID) VALUES
('FC Bayern Munich', 4),
('Borussia Dortmund', 4),
('RB Leipzig', 4);

-- Ligue 1
INSERT INTO Club (ClubName, LeagueID) VALUES
('Paris Saint-Germain', 5);

-- MLS
INSERT INTO Club (ClubName, LeagueID) VALUES
('Inter Miami CF', 9),
('Columbus Crew SC', 9);

-- Saudi League
INSERT INTO Club (ClubName, LeagueID) VALUES
('Al-Hilal', 10),
('Al-Nassr', 10),
('Al-Ittihad', 10);



INSERT INTO Positions (PositionCode, RoleGroup) VALUES
('GK','GOALKEEPER'),
('CB','DEFENDER'),
('LB','DEFENDER'),
('RB','DEFENDER'),
('DMF','MIDFIELDER'),
('CMF','MIDFIELDER'),
('AMF','MIDFIELDER'),
('LWF','WINGER'),
('RWF','WINGER'),
('CF','FORWARD'),
('SS','FORWARD');


INSERT INTO StatType (StatName) VALUES
('OffensiveAwareness'),('Finishing'),('BallControl'),
('Dribbling'),('Passing'),('KickingPower'),
('Speed'),('Acceleration'),('Stamina'),
('Balance'),('PhysicalContact'),('Jump'),
('DefensiveAwareness'),('Tackling'),('Aggression'),
('GkAwareness'),('GkCatching'),('GkParrying'),
('GkReflexes'),('GkReach');


INSERT INTO TrainingProgram (ProgramName) VALUES
('Shooting'),
('Passing'),
('Dribbling'),
('Dexterity'),
('Lower Body Strength'),
('Aerial Strength'),
('Defending'),
('GK 1'),
('GK 2'),
('GK 3');


INSERT INTO FormType (FormName, Multiplier) VALUES
('A',1.50),
('B',1.20),
('C',1.00),
('D',0.80),
('E',0.50);


INSERT INTO Player (PlayerName, Age, LeagueID, ClubID, NationalityID) VALUES
('Lionel Messi',36,9,(SELECT ClubID FROM Club WHERE ClubName='Inter Miami CF'),(SELECT NationalityID FROM Nationality WHERE CountryName='Argentina')),
('Cristiano Ronaldo',39,10,(SELECT ClubID FROM Club WHERE ClubName='Al-Nassr'),(SELECT NationalityID FROM Nationality WHERE CountryName='Portugal')),
('Kylian Mbappe',25,5,(SELECT ClubID FROM Club WHERE ClubName='Paris Saint-Germain'),(SELECT NationalityID FROM Nationality WHERE CountryName='France')),
('Erling Haaland',24,1,(SELECT ClubID FROM Club WHERE ClubName='Manchester City'),(SELECT NationalityID FROM Nationality WHERE CountryName='Norway')),
('Robert Lewandowski',35,2,(SELECT ClubID FROM Club WHERE ClubName='FC Barcelona'),(SELECT NationalityID FROM Nationality WHERE CountryName='Poland')),
('Lamine Yamal',17,2,(SELECT ClubID FROM Club WHERE ClubName='FC Barcelona'),(SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
('Neymar Jr',32,10,(SELECT ClubID FROM Club WHERE ClubName='Al-Hilal'),(SELECT NationalityID FROM Nationality WHERE CountryName='Brazil')),
('Kevin De Bruyne',33,1,(SELECT ClubID FROM Club WHERE ClubName='Manchester City'),(SELECT NationalityID FROM Nationality WHERE CountryName='Belgium')),
('Jude Bellingham',21,2,(SELECT ClubID FROM Club WHERE ClubName='Real Madrid'),(SELECT NationalityID FROM Nationality WHERE CountryName='England')),
('Vinicius Jr',24,2,(SELECT ClubID FROM Club WHERE ClubName='Real Madrid'),(SELECT NationalityID FROM Nationality WHERE CountryName='Brazil')),
('Mohamed Salah',32,1,(SELECT ClubID FROM Club WHERE ClubName='Liverpool'),(SELECT NationalityID FROM Nationality WHERE CountryName='Egypt')),
('Harry Kane',31,4,(SELECT ClubID FROM Club WHERE ClubName='FC Bayern Munich'),(SELECT NationalityID FROM Nationality WHERE CountryName='England')),
('Antoine Griezmann',33,2,(SELECT ClubID FROM Club WHERE ClubName='Atlético Madrid'),(SELECT NationalityID FROM Nationality WHERE CountryName='France')),
('Karim Benzema',36,10,(SELECT ClubID FROM Club WHERE ClubName='Al-Ittihad'),(SELECT NationalityID FROM Nationality WHERE CountryName='France')),
('Pedri',21,2,(SELECT ClubID FROM Club WHERE ClubName='FC Barcelona'),(SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
('Gavi',20,2,(SELECT ClubID FROM Club WHERE ClubName='FC Barcelona'),(SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
('Bukayo Saka',22,1,(SELECT ClubID FROM Club WHERE ClubName='Arsenal'),(SELECT NationalityID FROM Nationality WHERE CountryName='England')),
('Phil Foden',24,1,(SELECT ClubID FROM Club WHERE ClubName='Manchester City'),(SELECT NationalityID FROM Nationality WHERE CountryName='England')),
('Bruno Fernandes',29,1,(SELECT ClubID FROM Club WHERE ClubName='Manchester United'),(SELECT NationalityID FROM Nationality WHERE CountryName='Portugal')),
('Marcus Rashford',26,1,(SELECT ClubID FROM Club WHERE ClubName='Manchester United'),(SELECT NationalityID FROM Nationality WHERE CountryName='England'));




INSERT INTO Manager (ManagerName, PlayStyle, LeagueID, ClubID, NationalityID)
SELECT * FROM (
    VALUES
    -- POSSESSION
    ('Pep Guardiola', 'Possession', 1, (SELECT ClubID FROM Club WHERE ClubName='Manchester City'), (SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
    ('Xavi Hernandez', 'Possession', 2, (SELECT ClubID FROM Club WHERE ClubName='FC Barcelona'), (SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
    ('Mikel Arteta', 'Possession', 1, (SELECT ClubID FROM Club WHERE ClubName='Arsenal'), (SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
    ('Luis Enrique', 'Possession', 5, (SELECT ClubID FROM Club WHERE ClubName='Paris Saint-Germain'), (SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
    ('Roberto De Zerbi', 'Possession', 1, (SELECT ClubID FROM Club WHERE ClubName='Brighton & Hove Albion'), (SELECT NationalityID FROM Nationality WHERE CountryName='Italy')),
    ('Erik ten Hag', 'Possession', 1, (SELECT ClubID FROM Club WHERE ClubName='Manchester United'), (SELECT NationalityID FROM Nationality WHERE CountryName='Netherlands')),
    ('Julian Nagelsmann', 'Possession', 4, (SELECT ClubID FROM Club WHERE ClubName='FC Bayern Munich'), (SELECT NationalityID FROM Nationality WHERE CountryName='Germany')),
    ('Imanol Alguacil', 'Possession', 2, (SELECT ClubID FROM Club WHERE ClubName='Real Sociedad'), (SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
    ('Marcelo Bielsa', 'Possession', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Argentina')),
    ('Wilfried Nancy', 'Possession', 9, (SELECT ClubID FROM Club WHERE ClubName='Columbus Crew SC'), (SELECT NationalityID FROM Nationality WHERE CountryName='France')),

    -- QUICK COUNTER
    ('Jurgen Klopp', 'Quick Counter', 1, (SELECT ClubID FROM Club WHERE ClubName='Liverpool'), (SELECT NationalityID FROM Nationality WHERE CountryName='Germany')),
    ('Carlo Ancelotti', 'Quick Counter', 2, (SELECT ClubID FROM Club WHERE ClubName='Real Madrid'), (SELECT NationalityID FROM Nationality WHERE CountryName='Italy')),
    ('Zinedine Zidane', 'Quick Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='France')),
    ('Mauricio Pochettino', 'Quick Counter', 1, (SELECT ClubID FROM Club WHERE ClubName='Chelsea'), (SELECT NationalityID FROM Nationality WHERE CountryName='Argentina')),
    ('Didier Deschamps', 'Quick Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='France')),
    ('Lionel Scaloni', 'Quick Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Argentina')),
    ('Diego Simeone', 'Quick Counter', 2, (SELECT ClubID FROM Club WHERE ClubName='Atlético Madrid'), (SELECT NationalityID FROM Nationality WHERE CountryName='Argentina')),
    ('Gareth Southgate', 'Quick Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='England')),
    ('Ralf Rangnick', 'Quick Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Germany')),
    ('Marco Rose', 'Quick Counter', 4, (SELECT ClubID FROM Club WHERE ClubName='RB Leipzig'), (SELECT NationalityID FROM Nationality WHERE CountryName='Germany')),

    -- OUT WIDE
    ('Antonio Conte', 'Out Wide', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Italy')),
    ('Massimiliano Allegri', 'Out Wide', 3, (SELECT ClubID FROM Club WHERE ClubName='Juventus'), (SELECT NationalityID FROM Nationality WHERE CountryName='Italy')),
    ('Thomas Tuchel', 'Out Wide', 4, (SELECT ClubID FROM Club WHERE ClubName='FC Bayern Munich'), (SELECT NationalityID FROM Nationality WHERE CountryName='Germany')),
    ('Simone Inzaghi', 'Out Wide', 3, (SELECT ClubID FROM Club WHERE ClubName='Inter Milan'), (SELECT NationalityID FROM Nationality WHERE CountryName='Italy')),
    ('Unai Emery', 'Out Wide', 1, (SELECT ClubID FROM Club WHERE ClubName='Aston Villa'), (SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),
    ('Gian Piero Gasperini', 'Out Wide', 3, (SELECT ClubID FROM Club WHERE ClubName='Atalanta BC'), (SELECT NationalityID FROM Nationality WHERE CountryName='Italy')),
    ('Niko Kovac', 'Out Wide', 4, (SELECT ClubID FROM Club WHERE ClubName='VfL Wolfsburg'), (SELECT NationalityID FROM Nationality WHERE CountryName='Croatia')),
    ('Jorge Jesus', 'Out Wide', 10, (SELECT ClubID FROM Club WHERE ClubName='Al-Hilal'), (SELECT NationalityID FROM Nationality WHERE CountryName='Portugal')),
    ('Marco Silva', 'Out Wide', 1, (SELECT ClubID FROM Club WHERE ClubName='Fulham'), (SELECT NationalityID FROM Nationality WHERE CountryName='Portugal')),
    ('Andoni Iraola', 'Out Wide', 1, (SELECT ClubID FROM Club WHERE ClubName='Brighton & Hove Albion'), (SELECT NationalityID FROM Nationality WHERE CountryName='Spain')),

    -- LONG BALL COUNTER
    ('Jose Mourinho', 'Long Ball Counter', 3, (SELECT ClubID FROM Club WHERE ClubName='AS Roma'), (SELECT NationalityID FROM Nationality WHERE CountryName='Portugal')),
    ('Sean Dyche', 'Long Ball Counter', 1, (SELECT ClubID FROM Club WHERE ClubName='Everton'), (SELECT NationalityID FROM Nationality WHERE CountryName='England')),
    ('David Moyes', 'Long Ball Counter', 1, (SELECT ClubID FROM Club WHERE ClubName='West Ham United'), (SELECT NationalityID FROM Nationality WHERE CountryName='Scotland')),
    ('Roy Hodgson', 'Long Ball Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='England')),
    ('Claudio Ranieri', 'Long Ball Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Italy')),
    ('Igor Tudor', 'Long Ball Counter', 5, (SELECT ClubID FROM Club WHERE ClubName='Olympique Marseille'), (SELECT NationalityID FROM Nationality WHERE CountryName='Croatia')),
    ('Adi Hutter', 'Long Ball Counter', 5, (SELECT ClubID FROM Club WHERE ClubName='AS Monaco'), (SELECT NationalityID FROM Nationality WHERE CountryName='Austria')),
    ('Hernan Crespo', 'Long Ball Counter', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Argentina')),
    ('Steven Gerrard', 'Long Ball Counter', 10, (SELECT ClubID FROM Club WHERE ClubName='Al-Nassr'), (SELECT NationalityID FROM Nationality WHERE CountryName='England')),
    ('Edin Terzic', 'Long Ball Counter', 4, (SELECT ClubID FROM Club WHERE ClubName='Borussia Dortmund'), (SELECT NationalityID FROM Nationality WHERE CountryName='Germany')),

    -- LONG BALL
    ('Sam Allardyce', 'Long Ball', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='England')),
    ('Tony Pulis', 'Long Ball', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Wales')),
    ('Chris Wilder', 'Long Ball', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='England')),
    ('Slaven Bilic', 'Long Ball', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='Croatia')),
    ('Neil Warnock', 'Long Ball', NULL, NULL, (SELECT NationalityID FROM Nationality WHERE CountryName='England'))
) AS m(ManagerName, PlayStyle, LeagueID, ClubID, NationalityID);


INSERT INTO ManagerEffect (ManagerID, StatName, BoostValue)
SELECT * FROM (
    VALUES
    -- 1–10 (Possession)
    (1,'Passing',3),(1,'BallControl',2),(1,'Dribbling',1),
    (2,'Passing',3),(2,'BallControl',2),(2,'Dribbling',1),
    (3,'Passing',3),(3,'BallControl',2),(3,'Dribbling',1),
    (4,'Passing',3),(4,'BallControl',2),(4,'Dribbling',1),
    (5,'Passing',3),(5,'BallControl',2),(5,'Dribbling',1),
    (6,'Passing',3),(6,'BallControl',2),(6,'Dribbling',1),
    (7,'Passing',3),(7,'BallControl',2),(7,'Dribbling',1),
    (8,'Passing',3),(8,'BallControl',2),(8,'Dribbling',1),
    (9,'Passing',3),(9,'BallControl',2),(9,'Dribbling',1),
    (10,'Passing',3),(10,'BallControl',2),(10,'Dribbling',1),

    -- 11–20 (Quick Counter)
    (11,'Acceleration',3),(11,'Speed',2),(11,'Finishing',1),
    (12,'Acceleration',3),(12,'Speed',2),(12,'Finishing',1),
    (13,'Acceleration',3),(13,'Speed',2),(13,'Finishing',1),
    (14,'Acceleration',3),(14,'Speed',2),(14,'Finishing',1),
    (15,'Acceleration',3),(15,'Speed',2),(15,'Finishing',1),
    (16,'Acceleration',3),(16,'Speed',2),(16,'Finishing',1),
    (17,'Acceleration',3),(17,'Speed',2),(17,'Finishing',1),
    (18,'Acceleration',3),(18,'Speed',2),(18,'Finishing',1),
    (19,'Acceleration',3),(19,'Speed',2),(19,'Finishing',1),
    (20,'Acceleration',3),(20,'Speed',2),(20,'Finishing',1),

    -- 21–30 (Out Wide)
    (21,'Passing',2),(21,'Dribbling',2),(21,'Speed',1),
    (22,'Passing',2),(22,'Dribbling',2),(22,'Speed',1),
    (23,'Passing',2),(23,'Dribbling',2),(23,'Speed',1),
    (24,'Passing',2),(24,'Dribbling',2),(24,'Speed',1),
    (25,'Passing',2),(25,'Dribbling',2),(25,'Speed',1),
    (26,'Passing',2),(26,'Dribbling',2),(26,'Speed',1),
    (27,'Passing',2),(27,'Dribbling',2),(27,'Speed',1),
    (28,'Passing',2),(28,'Dribbling',2),(28,'Speed',1),
    (29,'Passing',2),(29,'Dribbling',2),(29,'Speed',1),
    (30,'Passing',2),(30,'Dribbling',2),(30,'Speed',1),

    -- 31–40 (Long Ball Counter)
    (31,'PhysicalContact',2),(31,'Jump',2),(31,'DefensiveAwareness',1),
    (32,'PhysicalContact',2),(32,'Jump',2),(32,'DefensiveAwareness',1),
    (33,'PhysicalContact',2),(33,'Jump',2),(33,'DefensiveAwareness',1),
    (34,'PhysicalContact',2),(34,'Jump',2),(34,'DefensiveAwareness',1),
    (35,'PhysicalContact',2),(35,'Jump',2),(35,'DefensiveAwareness',1),
    (36,'PhysicalContact',2),(36,'Jump',2),(36,'DefensiveAwareness',1),
    (37,'PhysicalContact',2),(37,'Jump',2),(37,'DefensiveAwareness',1),
    (38,'PhysicalContact',2),(38,'Jump',2),(38,'DefensiveAwareness',1),
    (39,'PhysicalContact',2),(39,'Jump',2),(39,'DefensiveAwareness',1),
    (40,'PhysicalContact',2),(40,'Jump',2),(40,'DefensiveAwareness',1),

    -- 41–45 (Long Ball)
    (41,'Jump',3),(41,'PhysicalContact',2),(41,'Finishing',1),
    (42,'Jump',3),(42,'PhysicalContact',2),(42,'Finishing',1),
    (43,'Jump',3),(43,'PhysicalContact',2),(43,'Finishing',1),
    (44,'Jump',3),(44,'PhysicalContact',2),(44,'Finishing',1),
    (45,'Jump',3),(45,'PhysicalContact',2),(45,'Finishing',1)
) AS me(ManagerID, StatName, BoostValue);


INSERT INTO InjuryType (InjuryName, DefaultMultiplier) VALUES 
('ACL Tear', 0.50),
('Achilles Tendon Rupture', 0.45),
('Broken Tibia/Fibula', 0.40),
('Metatarsal Fracture', 0.75),
('Meniscus Tear', 0.80),
('Hamstring Tear', 0.82),
('Ankle Ligament Sprain', 0.90),
('Groin Strain', 0.92),
('Concussion', 0.95)
ON CONFLICT (InjuryName) DO NOTHING;



INSERT INTO PositionPenalty (FromPosition, ToPosition, Penalty)
SELECT
  p1.PositionCode AS FromPosition,
  p2.PositionCode AS ToPosition,
  CASE
    -- SAME POSITION
    WHEN p1.PositionCode = p2.PositionCode THEN 0

    -- GOALKEEPER
    WHEN p1.RoleGroup = 'GOALKEEPER' AND p2.RoleGroup = 'DEFENDER' THEN 30
    WHEN p1.RoleGroup = 'GOALKEEPER' AND p2.RoleGroup = 'MIDFIELDER' THEN 45
    WHEN p1.RoleGroup = 'GOALKEEPER' AND p2.RoleGroup = 'WINGER' THEN 60
    WHEN p1.RoleGroup = 'GOALKEEPER' AND p2.RoleGroup = 'FORWARD' THEN 65

    -- DEFENDER
    WHEN p1.RoleGroup = 'DEFENDER' AND p2.RoleGroup = 'GOALKEEPER' THEN 35
    WHEN p1.RoleGroup = 'DEFENDER' AND p2.RoleGroup = 'MIDFIELDER' THEN 10
    WHEN p1.RoleGroup = 'DEFENDER' AND p2.RoleGroup = 'WINGER' THEN 20
    WHEN p1.RoleGroup = 'DEFENDER' AND p2.RoleGroup = 'FORWARD' THEN 25

    -- MIDFIELDER
    WHEN p1.RoleGroup = 'MIDFIELDER' AND p2.RoleGroup = 'GOALKEEPER' THEN 50
    WHEN p1.RoleGroup = 'MIDFIELDER' AND p2.RoleGroup = 'DEFENDER' THEN 12
    WHEN p1.RoleGroup = 'MIDFIELDER' AND p2.RoleGroup = 'WINGER' THEN 6
    WHEN p1.RoleGroup = 'MIDFIELDER' AND p2.RoleGroup = 'FORWARD' THEN 10

    -- WINGER
    WHEN p1.RoleGroup = 'WINGER' AND p2.RoleGroup = 'GOALKEEPER' THEN 55
    WHEN p1.RoleGroup = 'WINGER' AND p2.RoleGroup = 'DEFENDER' THEN 20
    WHEN p1.RoleGroup = 'WINGER' AND p2.RoleGroup = 'MIDFIELDER' THEN 8
    WHEN p1.RoleGroup = 'WINGER' AND p2.RoleGroup = 'FORWARD' THEN 4

    -- FORWARD
    WHEN p1.RoleGroup = 'FORWARD' AND p2.RoleGroup = 'GOALKEEPER' THEN 60
    WHEN p1.RoleGroup = 'FORWARD' AND p2.RoleGroup = 'DEFENDER' THEN 25
    WHEN p1.RoleGroup = 'FORWARD' AND p2.RoleGroup = 'MIDFIELDER' THEN 10
    WHEN p1.RoleGroup = 'FORWARD' AND p2.RoleGroup = 'WINGER' THEN 4

    ELSE 20
  END AS Penalty
FROM Positions p1
CROSS JOIN Positions p2;


select * from positionpenalty;




select * from  player;
select * from "User" ;
select * from nationality;
select * from card;



-- Rename the old column to match our new logic
ALTER TABLE Card RENAME COLUMN PrimaryPosition TO PositionCode;

-- Optional: Ensure it is linked to your new Positions table
ALTER TABLE Card 
ADD CONSTRAINT fk_card_position 
FOREIGN KEY (PositionCode) REFERENCES Positions(PositionCode);

select * from stattype;


INSERT INTO ProgressionRule (ProgramID, StatName, BoostPerPoint) VALUES
-- Shooting affects Finishing
(1, 'Finishing', 1),

-- Passing affects Passing
(2, 'Passing', 1),

-- Dribbling affects BallControl and Dribbling
(3, 'BallControl', 1),
(3, 'Dribbling', 1),

-- Dexterity affects OffensiveAwareness, Acceleration, Balance
(4, 'OffensiveAwareness', 1),
(4, 'Acceleration', 1),
(4, 'Balance', 1),

-- Lower Body Strength affects KickingPower, Speed, Stamina
(5, 'KickingPower', 1),
(5, 'Speed', 1),
(5, 'Stamina', 1),

-- Aerial Strength affects Jump, PhysicalContact
(6, 'Jump', 1),
(6, 'PhysicalContact', 1),

-- Defending affects DefensiveAwareness, Tackling, Aggression
(7, 'DefensiveAwareness', 1),
(7, 'Tackling', 1),
(7, 'Aggression', 1),

-- GK 1 affects GkAwareness, GkReflexes
(8, 'GkAwareness', 1),
(8, 'GkReflexes', 1),

-- GK 2 affects GkCatching, GkReach
(9, 'GkCatching', 1),
(9, 'GkReach', 1),

-- GK 3 affects GkParrying
(10, 'GkParrying', 1);

--17--
-- =========================
-- League
-- =========================
CREATE TABLE League (
    LeagueID SERIAL PRIMARY KEY,
    LeagueName VARCHAR(100) NOT NULL UNIQUE,
    Country VARCHAR(50)
);

-- =========================
-- Nationality
-- =========================
CREATE TABLE Nationality (
    NationalityID SERIAL PRIMARY KEY,
    CountryName VARCHAR(100) NOT NULL UNIQUE
);

-- =========================
-- Club
-- =========================
CREATE TABLE Club (
    ClubID SERIAL PRIMARY KEY,
    ClubName VARCHAR(100) NOT NULL,
    LeagueID INT NOT NULL,
    UNIQUE (ClubName, LeagueID),
    FOREIGN KEY (LeagueID)
        REFERENCES League(LeagueID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================
-- Positions
-- =========================
CREATE TABLE Positions (
    PositionCode VARCHAR(10) PRIMARY KEY,
    RoleGroup VARCHAR(20) NOT NULL
);

select * from positionpenalty;


select * from positions;

-- =========================
-- StatType
-- =========================
CREATE TABLE StatType (
    StatName VARCHAR(50) PRIMARY KEY
);
select * from stattype;


-- =========================
-- FormType
-- =========================
CREATE TABLE FormType (
    FormTypeID SERIAL PRIMARY KEY,
    FormName VARCHAR(50) NOT NULL UNIQUE,
    Multiplier DECIMAL(4,2) NOT NULL,
    CHECK (Multiplier BETWEEN 0.50 AND 1.50)
);

select * from formtype;

-- =========================
-- InjuryType
-- =========================
CREATE TABLE InjuryType (
    InjuryTypeID SERIAL PRIMARY KEY,
    InjuryName VARCHAR(100) NOT NULL UNIQUE,
    DefaultMultiplier DECIMAL(4,2) NOT NULL,
    CHECK (DefaultMultiplier BETWEEN 0.10 AND 1.00)
);

select * from injurytype;


-- =========================
-- TrainingProgram
-- =========================
CREATE TABLE TrainingProgram (
    ProgramID SERIAL PRIMARY KEY,
    ProgramName VARCHAR(50) NOT NULL UNIQUE
);


select * from trainingprogram;

-- =========================
-- PositionPenalty
-- =========================
CREATE TABLE PositionPenalty (
    FromPosition VARCHAR(10),
    ToPosition VARCHAR(10),
    Penalty INT NOT NULL,
    PRIMARY KEY (FromPosition, ToPosition),
    FOREIGN KEY (FromPosition) REFERENCES Positions(PositionCode),
    FOREIGN KEY (ToPosition) REFERENCES Positions(PositionCode)
);

-- =========================
-- User
-- =========================
CREATE TABLE "User" (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Email VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Role TEXT NOT NULL DEFAULT 'USER',
    CHECK (Role IN ('USER', 'ADMIN'))
);
select * from "User";


-- =========================
-- Player
-- =========================
CREATE TABLE Player (
    PlayerID SERIAL PRIMARY KEY,
    PlayerName VARCHAR(100) NOT NULL,
    Age INT CHECK (Age BETWEEN 10 AND 60),
    LeagueID INT,
    ClubID INT,
    NationalityID INT,
    FOREIGN KEY (LeagueID) REFERENCES League(LeagueID),
    FOREIGN KEY (ClubID) REFERENCES Club(ClubID),
    FOREIGN KEY (NationalityID) REFERENCES Nationality(NationalityID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- =========================
-- Manager
-- =========================
CREATE TABLE Manager (
    ManagerID SERIAL PRIMARY KEY,
    ManagerName VARCHAR(100) NOT NULL,
    PlayStyle VARCHAR(50) NOT NULL,
    LeagueID INT,
    ClubID INT,
    NationalityID INT,
    FOREIGN KEY (LeagueID) REFERENCES League(LeagueID),
    FOREIGN KEY (ClubID) REFERENCES Club(ClubID),
    FOREIGN KEY (NationalityID) REFERENCES Nationality(NationalityID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

ALTER TABLE Manager 
ADD CONSTRAINT check_playstyle_valid 
CHECK (PlayStyle IN ('Possession', 'Long Ball Counter', 'Quick Counter', 'Long Ball', 'Out Wide'));

-- =========================
-- Card
-- =========================
CREATE TABLE Card (
    CardID SERIAL PRIMARY KEY,
    PlayerID INT NOT NULL,
    CardType TEXT NOT NULL,
    PrimaryPosition VARCHAR(10) NOT NULL,
    BaseOverallRating INT NOT NULL,
    CurrentOverallRating INT NOT NULL,
    MaxOverallRating INT NOT NULL,
    TotalProgressionPoints INT NOT NULL DEFAULT 64,
    CHECK (CardType IN ('Standard', 'Legendary', 'POTW')),
    CHECK (BaseOverallRating BETWEEN 0 AND 100),
    CHECK (MaxOverallRating BETWEEN 0 AND 100),
    CHECK (CurrentOverallRating BETWEEN BaseOverallRating AND MaxOverallRating),
    FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE,
    FOREIGN KEY (PrimaryPosition) REFERENCES Positions(PositionCode)
);
select * from card;

-- =========================
-- PlayerStats
-- =========================
CREATE TABLE PlayerStats (
    StatsID SERIAL PRIMARY KEY,
    CardID INT UNIQUE NOT NULL,
    OffensiveAwareness INT CHECK (OffensiveAwareness BETWEEN 0 AND 100),
    Finishing INT CHECK (Finishing BETWEEN 0 AND 100),
    BallControl INT CHECK (BallControl BETWEEN 0 AND 100),
    Dribbling INT CHECK (Dribbling BETWEEN 0 AND 100),
    Passing INT CHECK (Passing BETWEEN 0 AND 100),
    KickingPower INT CHECK (KickingPower BETWEEN 0 AND 100),
    Speed INT CHECK (Speed BETWEEN 0 AND 100),
    Acceleration INT CHECK (Acceleration BETWEEN 0 AND 100),
    Stamina INT CHECK (Stamina BETWEEN 0 AND 100),
    Balance INT CHECK (Balance BETWEEN 0 AND 100),
    PhysicalContact INT CHECK (PhysicalContact BETWEEN 0 AND 100),
    Jump INT CHECK (Jump BETWEEN 0 AND 100),
    DefensiveAwareness INT CHECK (DefensiveAwareness BETWEEN 0 AND 100),
    Tackling INT CHECK (Tackling BETWEEN 0 AND 100),
    Aggression INT CHECK (Aggression BETWEEN 0 AND 100),
    GkAwareness INT CHECK (GkAwareness BETWEEN 0 AND 100),
    GkCatching INT CHECK (GkCatching BETWEEN 0 AND 100),
    GkParrying INT CHECK (GkParrying BETWEEN 0 AND 100),
    GkReflexes INT CHECK (GkReflexes BETWEEN 0 AND 100),
    GkReach INT CHECK (GkReach BETWEEN 0 AND 100),
    FOREIGN KEY (CardID) REFERENCES Card(CardID) ON DELETE CASCADE
);




-- =========================
-- ManagerEffect
-- =========================
CREATE TABLE ManagerEffect (
    ManagerID INT,
    StatName VARCHAR(50),
    BoostValue INT CHECK (BoostValue BETWEEN 1 AND 3),
    PRIMARY KEY (ManagerID, StatName),
    FOREIGN KEY (ManagerID) REFERENCES Manager(ManagerID) ON DELETE CASCADE,
    FOREIGN KEY (StatName) REFERENCES StatType(StatName)
);

-- =========================
-- PlayerForm
-- =========================
CREATE TABLE PlayerForm (
    FormID SERIAL PRIMARY KEY,
    PlayerID INT NOT NULL,
    FormTypeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE,
    FOREIGN KEY (FormTypeID) REFERENCES FormType(FormTypeID)
);


select * from ProgressionRule;
-- =========================
-- InjuryRecord
-- =========================
CREATE TABLE InjuryRecord (
    InjuryID SERIAL PRIMARY KEY,
    PlayerID INT NOT NULL,
    InjuryTypeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    Status VARCHAR(30) NOT NULL,
    FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE,
    FOREIGN KEY (InjuryTypeID) REFERENCES InjuryType(InjuryTypeID)
);

-- =========================
-- PlayerMarketValue
-- =========================
CREATE TABLE PlayerMarketValue (
    MarketValueID SERIAL PRIMARY KEY,
    PlayerID INT NOT NULL,
    BaseMarketValue DECIMAL(15,2) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE
);
select * from "user";

-- =========================
-- Squad
-- =========================
CREATE TABLE Squad (
    SquadID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    ManagerID INT NOT NULL,
    SquadName VARCHAR(100) NOT NULL,
    TeamStrength INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IsFavourite BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserID) REFERENCES "User"(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ManagerID) REFERENCES Manager(ManagerID)
);

ALTER TABLE Squad
ADD COLUMN Formation VARCHAR(20) NOT NULL DEFAULT '4-3-3'
CHECK (Formation IN (
    '4-3-3', 
    '4-4-2', 
    '4-2-3-1', 
    '3-5-2', 
    '5-3-2', 
    '4-1-4-1', 
    '3-4-3', 
    '4-5-1',
    '5-2-3'
));

-- =========================
-- SquadPlayer
-- =========================
CREATE TABLE SquadPlayer (
    SquadID INT,
    CardID INT,
    AssignedPosition VARCHAR(10) NOT NULL,
    IsStartingXI BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (SquadID, CardID),
    FOREIGN KEY (SquadID) REFERENCES Squad(SquadID) ON DELETE CASCADE,
    FOREIGN KEY (CardID) REFERENCES Card(CardID) ON DELETE CASCADE,
    FOREIGN KEY (AssignedPosition) REFERENCES Positions(PositionCode)
);
select * from progressionrule;
-- =========================
-- Review
-- =========================
CREATE TABLE Review (
    ReviewID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    CardID INT NOT NULL,
    MatchesPlayed INT NOT NULL,
    MatchesWon INT NOT NULL,
    Goals INT NOT NULL,
    Assists INT NOT NULL,
    CleanSheets INT NOT NULL,
    AverageRating DECIMAL(3,1) CHECK (AverageRating BETWEEN 0 AND 10),
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (UserID, CardID),
    FOREIGN KEY (UserID) REFERENCES "User"(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CardID) REFERENCES Card(CardID) ON DELETE CASCADE
);

-- =========================
-- ProgressionRule
-- =========================
CREATE TABLE ProgressionRule (
    ProgramID INT,
    StatName VARCHAR(50),
    BoostPerPoint INT DEFAULT 1,
    PRIMARY KEY (ProgramID, StatName),
    FOREIGN KEY (ProgramID) REFERENCES TrainingProgram(ProgramID) ON DELETE CASCADE,
    FOREIGN KEY (StatName) REFERENCES StatType(StatName) ON DELETE CASCADE
);

select * from stattype;
select * from trainingprogram;

-- =========================
-- CardAllocation
-- =========================
CREATE TABLE CardAllocation (
    UserID INT,
    CardID INT,
    ProgramID INT,
    PointsAllocated INT DEFAULT 0,
    PRIMARY KEY (UserID, CardID, ProgramID),
    FOREIGN KEY (UserID) REFERENCES "User"(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CardID) REFERENCES Card(CardID) ON DELETE CASCADE,
    FOREIGN KEY (ProgramID) REFERENCES TrainingProgram(ProgramID)
);

-- =========================
-- Build
-- =========================
CREATE TABLE Build (
    BuildID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    CardID INT NOT NULL,
    BuildName VARCHAR(100) NOT NULL,
    IsPublic BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES "User"(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CardID) REFERENCES Card(CardID) ON DELETE CASCADE
);

-- =========================
-- BuildStats
-- =========================
CREATE TABLE BuildStats (
    BuildID INT PRIMARY KEY,
    OffensiveAwareness INT,
    Finishing INT,
    BallControl INT,
    Dribbling INT,
    Passing INT,
    KickingPower INT,
    Speed INT,
    Acceleration INT,
    Stamina INT,
    Balance INT,
    PhysicalContact INT,
    Jump INT,
    DefensiveAwareness INT,
    Tackling INT,
    Aggression INT,
    GkAwareness INT,
    GkCatching INT,
    GkParrying INT,
    GkReflexes INT,
    GkReach INT,
    FOREIGN KEY (BuildID) REFERENCES Build(BuildID) ON DELETE CASCADE
);

-- =========================
-- BuildReaction
-- =========================
CREATE TABLE BuildReaction (
    BuildID INT,
    UserID INT,
    Reaction TEXT NOT NULL,
    PRIMARY KEY (BuildID, UserID),
    CHECK (Reaction IN ('LIKE', 'DISLIKE')),
    FOREIGN KEY (BuildID) REFERENCES Build(BuildID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES "User"(UserID) ON DELETE CASCADE
);


select * from positionpenalty

ALTER TABLE squad DROP CONSTRAINT squad_formation_check;

ALTER TABLE squad ADD CONSTRAINT squad_formation_check 
CHECK (formation IN ('4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-1-4-1', '3-4-3', '4-5-1', '5-2-3', 'custom'));