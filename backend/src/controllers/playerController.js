const pool = require('../db');



const getHelpers = async (req, res) => {
    try {
        console.log("Fetching helper lists...");
        const leagues = await pool.query('SELECT * FROM league');
        const clubs = await pool.query('SELECT * FROM club');
        const nations = await pool.query('SELECT * FROM nationality');
        const positions = await pool.query('SELECT * FROM Positions'); 
        
        res.json({ 
            leagues: leagues.rows, 
            clubs: clubs.rows, 
            nations: nations.rows,
            positions: positions.rows 
        });
    } catch (error) {
        console.error("❌ SQL Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const getClubsByLeague = async (req, res) => {
    const { leagueId } = req.query;
    try {
        const sql = 'SELECT * FROM club WHERE leagueid = $1 ORDER BY clubname ASC';
        const result = await pool.query(sql, [parseInt(leagueId)]);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ SQL Dependency Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const getPlayersList = async (req, res) => {
    try {
        const result = await pool.query('SELECT playerid, playername FROM player');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getCardsList = async (req, res) => {
    const { filter, sort } = req.query; 

    try {
        let sql = `
            SELECT 
                p.PlayerID, p.PlayerName,
                c.CardID, c.CardType, c.BaseOverallRating, c.CurrentOverallRating, c.PositionCode,
                c.GPCost as gpcost
            FROM Player p
            LEFT JOIN Card c ON p.PlayerID = c.PlayerID
            WHERE 1=1 
        `;

        const params = [];
        let paramIdx = 1;

        if (filter === 'cards_only') {
            sql += ` AND c.CardID IS NOT NULL`;
        } else if (filter === 'no_cards') {
            sql += ` AND c.CardID IS NULL`;
        } else if (['Legendary', 'POTW', 'Standard'].includes(filter)) {
            sql += ` AND c.CardType = $${paramIdx++}`;
            params.push(filter);
        }

        if (sort === 'ovr_desc') {
            sql += ` ORDER BY c.BaseOverallRating DESC NULLS LAST, p.PlayerName ASC`;
        } else if (sort === 'ovr_asc') {
            sql += ` ORDER BY c.BaseOverallRating ASC NULLS LAST, p.PlayerName ASC`;
        } else if (sort === 'name_asc') {
            sql += ` ORDER BY p.PlayerName ASC`;
        } else if (sort === 'name_desc') {
            sql += ` ORDER BY p.PlayerName DESC`;
        } else {
            sql += ` ORDER BY p.PlayerID DESC, c.CardID DESC`; 
        }

        const result = await pool.query(sql, params);
        
        const formattedData = result.rows.map(row => ({
            cardid: row.cardid,
            cardtype: row.cardtype || "No Card Configured",
            baseoverallrating: row.baseoverallrating || "-",
            currentoverallrating: row.currentoverallrating || "-",
            playerid: row.playerid,
            player: {
                playername: row.playername || "Unknown Player",
                primaryposition: row.positioncode || "N/A" 
            }
        }));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getCardDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT 
                c.*, 
                p.playername, p.age, 
                p.height AS player_height, 
                p.weight AS player_weight, 
                p.preferredfoot AS player_preferredfoot, 
                p.playstyle AS player_playstyle, 
                p.weakfootusage, p.weakfootaccuracy, p.formconsistency, 
                p.armlength, p.shoulderwidth, p.necklength, p.chestmeasurement, p.necksize, p.shoulderheight, p.leglength, p.thighsize, p.waistsize, p.armsize, p.calfsize, 
                n.countryname, n.flagurl, 
                cl.clubname, cl.logourl, 
                l.leaguename, 
                c.positioncode AS card_positioncode, 
                s.* 
            FROM card c
            JOIN player p ON c.playerid = p.playerid
            LEFT JOIN nationality n ON p.nationalityid = n.nationalityid
            LEFT JOIN club cl ON p.clubid = cl.clubid
            LEFT JOIN league l ON p.leagueid = l.leagueid
            LEFT JOIN playerstats s ON c.cardid = s.cardid
            WHERE c.cardid = $1
        `;
        const result = await pool.query(sql, [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Card not found" });
        const row = result.rows[0];
        const posCode = row.card_positioncode || row.positioncode || 'AMF';
        const data = {
            ...row,
            positioncode: posCode,
            primaryposition: posCode,
            skills: row.skills || ['Double Touch', 'First Time Shot', 'One Touch Pass', 'Long Range Shooting', 'Blitz Curler'],
            comskills: row.comskills || ['Mazing Run', 'Long Ball Expert'],
            tierbadge: row.tierbadge || 'S+',
            livecondition: row.livecondition || 'B',
            booster1: row.booster1 || 'Off the ball +4',
            booster2: row.booster2 || 'Technique +3',
            player: {
                playername: row.playername, 
                age: row.age,
                height: row.player_height || row.height || 180,
                weight: row.player_weight || row.weight || 75,
                preferredfoot: row.player_preferredfoot || row.preferredfoot || 'Right',
                playstyle: row.player_playstyle || row.playstyle || 'Box-to-Box',
                weakfootusage: row.weakfootusage || 'Occasionally',
                weakfootaccuracy: row.weakfootaccuracy || 'High',
                formconsistency: row.formconsistency || 'Unwavering',
                positioncode: posCode,
                primaryposition: posCode,
                modelMetrics: {
                    armlength: row.armlength || 12,
                    shoulderwidth: row.shoulderwidth || 5,
                    necklength: row.necklength || 4,
                    chestmeasurement: row.chestmeasurement || 6,
                    necksize: row.necksize || 7,
                    shoulderheight: row.shoulderheight || 11,
                    leglength: row.leglength || 14,
                    thighsize: row.thighsize || 5,
                    waistsize: row.waistsize || 9,
                    armsize: row.armsize || 5,
                    calfsize: row.calfsize || 3
                },
                nationality: { countryname: row.countryname, flagurl: row.flagurl },
                club: { clubname: row.clubname, logourl: row.logourl },
                league: { leaguename: row.leaguename },
                position: row.positioncode
            },
            stats: {
                offensiveawareness: row.offensiveawareness,
                finishing: row.finishing,
                ballcontrol: row.ballcontrol,
                dribbling: row.dribbling,
                passing: row.passing,
                kickingpower: row.kickingpower,
                speed: row.speed,
                acceleration: row.acceleration,
                stamina: row.stamina,
                balance: row.balance,
                physicalcontact: row.physicalcontact,
                jump: row.jump,
                defensiveawareness: row.defensiveawareness,
                tackling: row.tackling,
                aggression: row.aggression,
                gkawareness: row.gkawareness,
                gkcatching: row.gkcatching,
                gkparrying: row.gkparrying,
                gkreflexes: row.gkreflexes,
                gkreach: row.gkreach
            }
        };
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const comparePlayers = async (req, res) => {
    const { cardId1, cardId2 } = req.params;
    
    try {
        const sql = `
            SELECT 
                c1.CardID as card1_id, 
                c1.CardType as card1_type, 
                c1.BaseOverallRating as card1_rating,
                c1.PositionCode as card1_position,
                p1.PlayerName as player1_name, 
                p1.Age as player1_age,
                n1.CountryName as player1_nation, 
                cl1.ClubName as player1_club,
                s1.offensiveawareness as p1_offensiveawareness,
                s1.finishing as p1_finishing,
                s1.ballcontrol as p1_ballcontrol,
                s1.dribbling as p1_dribbling,
                s1.passing as p1_passing,
                s1.kickingpower as p1_kickingpower,
                s1.speed as p1_speed,
                s1.acceleration as p1_acceleration,
                s1.stamina as p1_stamina,
                s1.balance as p1_balance,
                s1.physicalcontact as p1_physicalcontact,
                s1.jump as p1_jump,
                s1.defensiveawareness as p1_defensiveawareness,
                s1.tackling as p1_tackling,
                s1.aggression as p1_aggression,
                s1.gkawareness as p1_gkawareness,
                s1.gkcatching as p1_gkcatching,
                s1.gkparrying as p1_gkparrying,
                s1.gkreflexes as p1_gkreflexes,
                s1.gkreach as p1_gkreach,
                
                c2.CardID as card2_id, 
                c2.CardType as card2_type, 
                c2.BaseOverallRating as card2_rating,
                c2.PositionCode as card2_position,
                p2.PlayerName as player2_name, 
                p2.Age as player2_age,
                n2.CountryName as player2_nation, 
                cl2.ClubName as player2_club,
                s2.offensiveawareness as p2_offensiveawareness,
                s2.finishing as p2_finishing,
                s2.ballcontrol as p2_ballcontrol,
                s2.dribbling as p2_dribbling,
                s2.passing as p2_passing,
                s2.kickingpower as p2_kickingpower,
                s2.speed as p2_speed,
                s2.acceleration as p2_acceleration,
                s2.stamina as p2_stamina,
                s2.balance as p2_balance,
                s2.physicalcontact as p2_physicalcontact,
                s2.jump as p2_jump,
                s2.defensiveawareness as p2_defensiveawareness,
                s2.tackling as p2_tackling,
                s2.aggression as p2_aggression,
                s2.gkawareness as p2_gkawareness,
                s2.gkcatching as p2_gkcatching,
                s2.gkparrying as p2_gkparrying,
                s2.gkreflexes as p2_gkreflexes,
                s2.gkreach as p2_gkreach
                
            FROM Card c1
            JOIN Player p1 ON c1.PlayerID = p1.PlayerID
            LEFT JOIN Nationality n1 ON p1.NationalityID = n1.NationalityID
            LEFT JOIN Club cl1 ON p1.ClubID = cl1.ClubID
            LEFT JOIN PlayerStats s1 ON c1.CardID = s1.CardID,
            
                 Card c2
            JOIN Player p2 ON c2.PlayerID = p2.PlayerID
            LEFT JOIN Nationality n2 ON p2.NationalityID = n2.NationalityID
            LEFT JOIN Club cl2 ON p2.ClubID = cl2.ClubID
            LEFT JOIN PlayerStats s2 ON c2.CardID = s2.CardID
            
            WHERE c1.CardID = $1 AND c2.CardID = $2
        `;
        
        const result = await pool.query(sql, [parseInt(cardId1), parseInt(cardId2)]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "One or both cards not found" });
        }
        
        const row = result.rows[0];
        
        
        const comparison = {
            player1: {
                cardId: row.card1_id,
                name: row.player1_name,
                age: row.player1_age,
                nation: row.player1_nation,
                club: row.player1_club,
                cardType: row.card1_type,
                position: row.card1_position,
                rating: row.card1_rating,
                stats: {
                    offensiveawareness: row.p1_offensiveawareness,
                    finishing: row.p1_finishing,
                    ballcontrol: row.p1_ballcontrol,
                    dribbling: row.p1_dribbling,
                    passing: row.p1_passing,
                    kickingpower: row.p1_kickingpower,
                    speed: row.p1_speed,
                    acceleration: row.p1_acceleration,
                    stamina: row.p1_stamina,
                    balance: row.p1_balance,
                    physicalcontact: row.p1_physicalcontact,
                    jump: row.p1_jump,
                    defensiveawareness: row.p1_defensiveawareness,
                    tackling: row.p1_tackling,
                    aggression: row.p1_aggression,
                    gkawareness: row.p1_gkawareness,
                    gkcatching: row.p1_gkcatching,
                    gkparrying: row.p1_gkparrying,
                    gkreflexes: row.p1_gkreflexes,
                    gkreach: row.p1_gkreach
                }
            },
            player2: {
                cardId: row.card2_id,
                name: row.player2_name,
                age: row.player2_age,
                nation: row.player2_nation,
                club: row.player2_club,
                cardType: row.card2_type,
                position: row.card2_position,
                rating: row.card2_rating,
                stats: {
                    offensiveawareness: row.p2_offensiveawareness,
                    finishing: row.p2_finishing,
                    ballcontrol: row.p2_ballcontrol,
                    dribbling: row.p2_dribbling,
                    passing: row.p2_passing,
                    kickingpower: row.p2_kickingpower,
                    speed: row.p2_speed,
                    acceleration: row.p2_acceleration,
                    stamina: row.p2_stamina,
                    balance: row.p2_balance,
                    physicalcontact: row.p2_physicalcontact,
                    jump: row.p2_jump,
                    defensiveawareness: row.p2_defensiveawareness,
                    tackling: row.p2_tackling,
                    aggression: row.p2_aggression,
                    gkawareness: row.p2_gkawareness,
                    gkcatching: row.p2_gkcatching,
                    gkparrying: row.p2_gkparrying,
                    gkreflexes: row.p2_gkreflexes,
                    gkreach: row.p2_gkreach
                }
            }
        };
        
        res.json(comparison);
    } catch (error) {
        console.error("Compare Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const deletePlayer = async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "Invalid Player ID provided." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
    
        await client.query('DELETE FROM Player WHERE PlayerID = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: "✅ Player and all associated cards deleted." });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Delete Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};


const deleteCard = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

    
       await client.query('DELETE FROM Card WHERE CardID = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: "✅ Card deleted. Player remains active." });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Delete Card Error:", error);
        res.status(500).json({ error: "Could not delete card." });
    } finally {
        client.release();
    }
};


const getPlayerSuggestions = async (req, res) => {
    const { term } = req.query;
    try {
        const sql = `SELECT DISTINCT playername FROM player WHERE playername ILIKE $1 ORDER BY playername ASC LIMIT 10`;
        const result = await pool.query(sql, [`%${term}%`]);
        res.json(result.rows.map(row => row.playername));
    } catch (error) {
        console.error("❌ Suggestions Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const smartSearchCards = async (req, res) => {
    const b = req.query; 
    const clean = (val) => (val === '' || val === undefined || val === 'null' ? null : val);
    try {
        const sql = `SELECT * FROM smart_search_pro($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`;
        const values = [
            clean(b.name), b.leagueId ? parseInt(b.leagueId) : null, b.clubId ? parseInt(b.clubId) : null, b.nationId ? parseInt(b.nationId) : null,
            clean(b.cardType), clean(b.posCode),
            b.offAware ? parseInt(b.offAware) : null, b.finishing ? parseInt(b.finishing) : null, b.ballCtrl ? parseInt(b.ballCtrl) : null, b.dribbling ? parseInt(b.dribbling) : null,
            b.passing ? parseInt(b.passing) : null, b.kickPwr ? parseInt(b.kickPwr) : null, b.speed ? parseInt(b.speed) : null, b.accel ? parseInt(b.accel) : null,
            b.stamina ? parseInt(b.stamina) : null, b.balance ? parseInt(b.balance) : null, b.physCont ? parseInt(b.physCont) : null, b.jump ? parseInt(b.jump) : null,
            b.defAware ? parseInt(b.defAware) : null, b.tackling ? parseInt(b.tackling) : null, b.aggression ? parseInt(b.aggression) : null, b.gkAware ? parseInt(b.gkAware) : null,
            b.gkCatch ? parseInt(b.gkCatch) : null, b.gkParry ? parseInt(b.gkParry) : null, b.gkReflex ? parseInt(b.gkReflex) : null, b.gkReach ? parseInt(b.gkReach) : null
        ];
        const result = await pool.query(sql, values);
        const formattedData = result.rows.map(row => ({
            cardid: row.cardid,
            cardtype: row.cardtype || "Standard",
            baseoverallrating: row.baserating || "-",
            currentoverallrating: row.currentoverallrating || "-",
            playerid: row.playerid,
            player: {
                playername: row.playername || "Unknown Player",
                primaryposition: row.positioncode || "N/A"
            }
        }));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const addPlayer = async (req, res) => {
    const { playername, age, nationalityid, clubid, leagueid, marketvalue } = req.body;
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const sqlPlayer = `
            SELECT insert_player_sql(
                $1::varchar, 
                $2::int, 
                $3::int, 
                $4::int, 
                $5::int
            ) as result
        `;
        
        const valuesPlayer = [
            playername, 
            parseInt(age), 
            parseInt(nationalityid), 
            parseInt(clubid), 
            parseInt(leagueid)
        ];

        const resultPlayer = await client.query(sqlPlayer, valuesPlayer);
        
        const functionOutput = resultPlayer.rows[0].result; 
        const newPlayerId = functionOutput.id;

        console.log("New Player ID:", newPlayerId);

        if (!newPlayerId) {
            throw new Error("Failed to generate Player ID.");
        }

        if (marketvalue) {
            const cleanMV = parseFloat(marketvalue.toString().replace(/[^0-9.]/g, ''));
            
            const sqlMarket = `
                INSERT INTO PlayerMarketValue (PlayerID, BaseMarketValue, StartDate)
                VALUES ($1, $2, CURRENT_DATE)
            `;
            await client.query(sqlMarket, [newPlayerId, cleanMV]);
        }

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            playerid: newPlayerId, 
            message: "Player created successfully" 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Add Player Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};


const addCard = async (req, res) => {
    const { playerid, cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating, gpcost, cardimageurl, imageurl } = req.body;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const sql = `SELECT * FROM insert_card_sql($1, $2, $3, $4, $5, $6)`;
        const values = [
            parseInt(playerid), 
            cardtype, 
            positioncode, 
            parseInt(baseoverallrating), 
            parseInt(currentoverallrating), 
            parseInt(maxoverallrating || 85)
        ];

        const result = await client.query(sql, values);
        const cardId = result.rows[0]?.id || result.rows[0]?.insert_card_sql?.id;

        // If card is Standard and gpcost is provided, save gpcost
        if (cardId && cardtype === 'Standard' && gpcost !== undefined && gpcost !== '') {
            await client.query('UPDATE card SET gpcost = $1 WHERE cardid = $2', [parseInt(gpcost), cardId]);
        }

        // Save optional cardimageurl if provided
        const imgUrl = (cardimageurl || imageurl || '').trim();
        if (cardId && imgUrl) {
            await client.query('ALTER TABLE card ADD COLUMN IF NOT EXISTS cardimageurl VARCHAR(500)');
            await client.query('UPDATE card SET cardimageurl = $1 WHERE cardid = $2', [imgUrl, cardId]);
        }

        await client.query('COMMIT');

        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Add Card Transaction Error:", error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

const addManager = async (req, res) => {
    const { managername, playstyle, leagueid, clubid, nationalityid } = req.body;
    
    
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        const sql = `SELECT * FROM insert_manager_sql($1, $2, $3, $4, $5)`;
        const values = [
            managername, 
            playstyle, 
            parseInt(leagueid), 
            parseInt(clubid), 
            parseInt(nationalityid)
        ];

        
        const result = await client.query(sql, values);        
        await client.query('COMMIT');   
        res.json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Add Manager Transaction Error:", error);
        res.status(400).json({ error: error.message });
        
    } finally {
        
        client.release();
    }
};
const getManagersList = async (req, res) => {
    try {
        const sql = `SELECT m.*, l.leaguename, c.clubname, n.countryname FROM Manager m 
                     LEFT JOIN League l ON m.leagueid = l.leagueid 
                     LEFT JOIN Club c ON m.clubid = c.clubid 
                     LEFT JOIN Nationality n ON m.nationalityid = n.nationalityid`;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const deleteManager = async (req, res) => {
    const managerId = parseInt(req.params.id);
    
    
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        const sql = 'DELETE FROM Manager WHERE ManagerID = $1';
        
        
        const result = await client.query(sql, [managerId]);

        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Manager not found." });
        }

        
        await client.query('COMMIT');

        res.json({ message: "✅ Manager deleted successfully via SQL." });

    } catch (error) {
        
        await client.query('ROLLBACK');
        console.error("Delete Manager Transaction Error:", error);
        
        
        const errorMessage = error.code === '23503' 
            ? "Cannot delete manager: They are still assigned to an active squad." 
            : error.message;

        res.status(500).json({ error: errorMessage });
        
    } finally {
        
        client.release();
    }
};

const addStats = async (req, res) => {
    const b = req.body;
    
    
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        const sql = `SELECT * FROM insert_stats_sql($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`;
        
        
        const values = [
            parseInt(b.cardid), 
            parseInt(b.offensiveawareness), parseInt(b.finishing), 
            parseInt(b.ballcontrol), parseInt(b.dribbling), 
            parseInt(b.passing), parseInt(b.kickingpower), 
            parseInt(b.speed), parseInt(b.acceleration), 
            parseInt(b.stamina), parseInt(b.balance), 
            parseInt(b.physicalcontact), parseInt(b.jump), 
            parseInt(b.defensiveawareness), parseInt(b.tackling), 
            parseInt(b.aggression), parseInt(b.gkawareness), 
            parseInt(b.gkcatching), parseInt(b.gkparrying), 
            parseInt(b.gkreflexes), parseInt(b.gkreach)
        ];

        
        const result = await client.query(sql, values);

        
        await client.query('COMMIT');

        res.json({ message: "✅ Stats saved successfully!", data: result.rows[0] });

    } catch (error) { 
        
        await client.query('ROLLBACK');
        
        console.error("❌ DB/Trigger Error Blocked Save:", error.message); 
        
        
        const errorMessage = error.code === '23503' 
            ? "Cannot save stats: The specified Card ID does not exist." 
            : error.message;

        res.status(400).json({ error: errorMessage }); 
    } finally {
        
        client.release();
    }
};
const getCalculatedStats = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `SELECT calculate_suggested_stats($1::int) as stats`;
        const result = await pool.query(sql, [parseInt(id)]);
        
        if (result.rows.length > 0 && result.rows[0].stats) {
            
            if (result.rows[0].stats.error) {
                return res.status(404).json({ error: result.rows[0].stats.error });
            }
            return res.json(result.rows[0].stats);
        }
        res.status(404).json({ error: "Calculation failed" });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
};

const getSimilarPlayers = async (req, res) => {
    const { cardId } = req.params;

    try {
        const query = `
            SELECT 
                ret_cardid AS cardid,
                ret_playername AS playername,
                ret_cardtype AS cardtype,
                ret_positioncode AS positioncode, -- Updated mapping
                ret_baseoverallrating AS baseoverallrating,
                ret_statdifference AS statdifference
            FROM find_similar_players($1);
        `;
        
        const { rows } = await pool.query(query, [cardId]);
        res.json(rows);

    } catch (err) {
        console.error("Error calling find_similar_players function:", err);
        res.status(500).json({ error: "Failed to calculate similar players" });
    }
};

const updatePlayerStatus = async (req, res) => {
    const { playerId, formId, injuryId } = req.body;

    if (!playerId || !formId) {
        return res.status(400).json({ error: "Player ID and Form ID are required." });
    }

    const safeInjuryId = (injuryId && injuryId != '0') ? parseInt(injuryId) : null;

    
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        
        await client.query(
            'CALL update_player_status_proc($1, $2, $3)', 
            [parseInt(playerId), parseInt(formId), safeInjuryId]
        );

       
        await client.query('COMMIT');

        console.log(`✅ Status Updated for Player ${playerId}`);
        res.json({ success: true, message: "Player Status Updated Successfully!" });

    } catch (err) {
        
        await client.query('ROLLBACK');
        
        console.error("❌ Transaction Rolled Back due to Error:", err.message);
        res.status(500).json({ error: "Transaction failed. All changes rolled back." });
        
    } finally {
        
        client.release();
    }
};


const getPlayerValueHistory = async (req, res) => {
    const { playerId } = req.params;

    try {
        const query = `
            SELECT BaseMarketValue, StartDate, LastUpdated 
            FROM PlayerMarketValue 
            WHERE PlayerID = $1 
            ORDER BY StartDate DESC
        `;
        const result = await pool.query(query, [playerId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};


const getPenalties = async (req, res) => {
    try {
        
        const result = await pool.query('SELECT * FROM PositionPenalty');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching position penalties:", err);
        res.status(500).json({ error: "Database error" });
    }
};

const getTopRatedCards = async (req, res) => {
    try {
        const query = `
            SELECT 
                c.CardID, p.PlayerName, c.CardType, c.positioncode, c.BaseOverallRating,
                ROUND(AVG(r.AverageRating), 2) as communityrating,
                COUNT(r.ReviewID) as reviewcount
            FROM Card c
            JOIN Player p ON c.PlayerID = p.PlayerID
            JOIN Review r ON c.CardID = r.CardID
            GROUP BY c.CardID, p.PlayerName, c.CardType, c.positioncode, c.BaseOverallRating
            ORDER BY communityrating DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch top rated cards" });
    }
};

const getTopGoalScorers = async (req, res) => {
    try {
        const query = `
            SELECT 
                c.CardID, 
                p.PlayerName, 
                c.CardType, 
                c.positioncode, 
                c.BaseOverallRating,
                SUM(r.Goals) as total_goals,
                SUM(r.MatchesPlayed) as total_matches,
                -- We calculate the global GPG for this card
                ROUND(CAST(SUM(r.Goals) AS DEC) / NULLIF(SUM(r.MatchesPlayed), 0), 2) as max_gpg
            FROM Card c
            JOIN Player p ON c.PlayerID = p.PlayerID
            JOIN Review r ON c.CardID = r.CardID
            GROUP BY c.CardID, p.PlayerName, c.CardType, c.positioncode, c.BaseOverallRating
            -- We filter for players who have actually played at least 5 matches total
            -- to avoid "1 match, 5 goals" flukes ranking #1.
            HAVING SUM(r.MatchesPlayed) >= 5
            ORDER BY max_gpg DESC, total_goals DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching lethal scorers:", err);
        res.status(500).json({ error: "Failed to fetch scorers" });
    }
};

const getInjuryPronePlayers = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.PlayerID, 
                p.PlayerName, 
                c.CardID,
                c.CardType, 
                c.positioncode, 
                COUNT(ir.InjuryID) as injury_count,
                
                SUM(CASE WHEN ir.EndDate IS NOT NULL THEN (ir.EndDate - ir.StartDate) ELSE 0 END) as total_days_out
            FROM Player p
            JOIN Card c ON p.PlayerID = c.PlayerID
            JOIN InjuryRecord ir ON p.PlayerID = ir.PlayerID
            GROUP BY p.PlayerID, p.PlayerName, c.CardID, c.CardType, c.positioncode
            ORDER BY injury_count DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching injury prone players:", err);
        res.status(500).json({ error: "Failed to fetch injury data" });
    }
};


const getConsistentPlayers = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.PlayerID, 
                p.PlayerName, 
                c.CardID,
                c.CardType, 
                c.positioncode, 
                COUNT(pf.FormID) as a_form_count
            FROM Player p
            JOIN Card c ON p.PlayerID = c.PlayerID
            JOIN PlayerForm pf ON p.PlayerID = pf.PlayerID
            JOIN FormType ft ON pf.FormTypeID = ft.FormTypeID
            WHERE ft.FormName = 'A'
            GROUP BY p.PlayerID, p.PlayerName, c.CardID, c.CardType, c.positioncode
            ORDER BY a_form_count DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching consistent players:", err);
        res.status(500).json({ error: "Failed to fetch consistency data" });
    }
};


const getRecentTopForms = async (req, res) => {
    try {
        const query = `
            SELECT * FROM (
                SELECT DISTINCT ON (p.PlayerID)
                    p.PlayerName,
                    c.CardID,
                    c.positioncode,
                    c.BaseOverallRating,
                    ft.FormName,
                    pf.StartDate as last_updated
                FROM Player p
                JOIN Card c ON p.PlayerID = c.PlayerID 
                JOIN PlayerForm pf ON p.PlayerID = pf.PlayerID
                JOIN FormType ft ON pf.FormTypeID = ft.FormTypeID
                ORDER BY p.PlayerID, pf.StartDate DESC
            ) AS latest_records
           
            ORDER BY FormName ASC, BaseOverallRating DESC, last_updated DESC
            LIMIT 50; 
        `;

        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching recent forms:", err);
        res.status(500).json({ error: "Failed to fetch recent form data" });
    }
};

const getTopAvgMarketValue = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.PlayerID, 
                p.PlayerName, 
                c.CardID,
                c.positioncode, 
                c.BaseOverallRating,
                ROUND(AVG(pmv.BaseMarketValue), 2) as avg_market_value,
                COUNT(pmv.MarketValueID) as value_records
            FROM Player p
            JOIN Card c ON p.PlayerID = c.PlayerID
            JOIN PlayerMarketValue pmv ON p.PlayerID = pmv.PlayerID
            GROUP BY p.PlayerID, p.PlayerName, c.CardID, c.positioncode, c.BaseOverallRating
            ORDER BY avg_market_value DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching top market values:", err);
        res.status(500).json({ error: "Failed to fetch market value data" });
    }
};

const updateCard = async (req, res) => {
    const { id } = req.params;
    const { 
        cardtype, positioncode, baseoverallrating, currentoverallrating, maxoverallrating,
        primarypositions, secondarypositions, booster1, booster2, tierbadge, livecondition,
        skills, comskills, maxlevel, progressionpoints, gpcost
    } = req.body;

    try {
        const primArray = typeof primarypositions === 'string' 
            ? primarypositions.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            : Array.isArray(primarypositions) ? primarypositions : null;
        const secArray = typeof secondarypositions === 'string' 
            ? secondarypositions.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            : Array.isArray(secondarypositions) ? secondarypositions : null;

        const skillsArray = typeof skills === 'string'
            ? skills.split(',').map(s => s.trim()).filter(Boolean)
            : Array.isArray(skills) ? skills : null;
        const comSkillsArray = typeof comskills === 'string'
            ? comskills.split(',').map(s => s.trim()).filter(Boolean)
            : Array.isArray(comskills) ? comskills : null;

        const gpValue = (cardtype === 'Standard' && gpcost !== undefined && gpcost !== '') 
            ? parseInt(gpcost) 
            : (cardtype && cardtype !== 'Standard' ? null : undefined);

        const sql = `
            UPDATE card 
            SET 
                cardtype = COALESCE($1, cardtype),
                positioncode = COALESCE($2, positioncode),
                baseoverallrating = COALESCE($3, baseoverallrating),
                currentoverallrating = COALESCE($4, currentoverallrating),
                maxoverallrating = COALESCE($5, maxoverallrating),
                primarypositions = COALESCE($6, primarypositions),
                secondarypositions = COALESCE($7, secondarypositions),
                booster1 = COALESCE($8, booster1),
                booster2 = COALESCE($9, booster2),
                tierbadge = COALESCE($10, tierbadge),
                livecondition = COALESCE($11, livecondition),
                skills = COALESCE($12, skills),
                comskills = COALESCE($13, comskills),
                maxlevel = COALESCE($15, maxlevel),
                progressionpoints = COALESCE($16, progressionpoints),
                gpcost = CASE WHEN $1 = 'Standard' THEN $17 ELSE CASE WHEN $1 IS NOT NULL THEN NULL ELSE gpcost END END
            WHERE cardid = $14
        `;
        await pool.query(sql, [
            cardtype || null, 
            positioncode ? positioncode.toUpperCase() : null, 
            baseoverallrating ? parseInt(baseoverallrating) : null, 
            currentoverallrating ? parseInt(currentoverallrating) : null, 
            maxoverallrating ? parseInt(maxoverallrating) : null,
            primArray, secArray, booster1 || null, booster2 || null, tierbadge || null, livecondition || null,
            skillsArray, comSkillsArray, parseInt(id),
            maxlevel ? parseInt(maxlevel) : null,
            progressionpoints ? parseInt(progressionpoints) : null,
            gpValue !== undefined ? gpValue : null
        ]);

        const imgUrl = req.body.cardimageurl !== undefined ? req.body.cardimageurl : req.body.imageurl;
        if (imgUrl !== undefined) {
            await pool.query('ALTER TABLE card ADD COLUMN IF NOT EXISTS cardimageurl VARCHAR(500)');
            await pool.query('UPDATE card SET cardimageurl = $1 WHERE cardid = $2', [imgUrl ? imgUrl.trim() : null, parseInt(id)]);
        }

        res.json({ message: "✅ Card details, skills, booster list, level cap & progression points updated successfully!" });
    } catch (error) {
        console.error("Update Card Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const updatePlayerModel = async (req, res) => {
    const { id } = req.params;
    const {
        height, weight, preferredfoot, playstyle,
        armlength, shoulderwidth, necklength, chestmeasurement,
        necksize, shoulderheight, leglength, thighsize, waistsize, armsize, calfsize
    } = req.body;

    try {
        const sql = `
            UPDATE player
            SET 
                height = COALESCE($1, height),
                weight = COALESCE($2, weight),
                preferredfoot = COALESCE($3, preferredfoot),
                playstyle = COALESCE($4, playstyle),
                armlength = COALESCE($5, armlength),
                shoulderwidth = COALESCE($6, shoulderwidth),
                necklength = COALESCE($7, necklength),
                chestmeasurement = COALESCE($8, chestmeasurement),
                necksize = COALESCE($9, necksize),
                shoulderheight = COALESCE($10, shoulderheight),
                leglength = COALESCE($11, leglength),
                thighsize = COALESCE($12, thighsize),
                waistsize = COALESCE($13, waistsize),
                armsize = COALESCE($14, armsize),
                calfsize = COALESCE($15, calfsize)
            WHERE playerid = $16
        `;
        await pool.query(sql, [
            height ? parseInt(height) : null,
            weight ? parseInt(weight) : null,
            preferredfoot || null,
            playstyle || null,
            armlength ? parseInt(armlength) : null,
            shoulderwidth ? parseInt(shoulderwidth) : null,
            necklength ? parseInt(necklength) : null,
            chestmeasurement ? parseInt(chestmeasurement) : null,
            necksize ? parseInt(necksize) : null,
            shoulderheight ? parseInt(shoulderheight) : null,
            leglength ? parseInt(leglength) : null,
            thighsize ? parseInt(thighsize) : null,
            waistsize ? parseInt(waistsize) : null,
            armsize ? parseInt(armsize) : null,
            calfsize ? parseInt(calfsize) : null,
            parseInt(id)
        ]);
        res.json({ message: "✅ Player 3D model and physics metrics updated successfully!" });
    } catch (error) {
        console.error("Update Player Model Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const getOtherVersions = async (req, res) => {
    const { playerid, cardid } = req.query;
    try {
        if (!playerid) return res.json([]);
        const sql = `
            SELECT c.*, p.playername, n.flagurl, cl.logourl
            FROM card c
            JOIN player p ON c.playerid = p.playerid
            LEFT JOIN nationality n ON p.nationalityid = n.nationalityid
            LEFT JOIN club cl ON p.clubid = cl.clubid
            WHERE c.playerid = $1 AND c.cardid != $2
            ORDER BY c.baseoverallrating DESC
        `;
        const { rows } = await pool.query(sql, [playerid, cardid || 0]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching other versions:", err);
        res.status(500).json({ error: "Failed to fetch other versions" });
    }
};

module.exports = { 
    getHelpers, 
    getClubsByLeague, 
    getPlayersList, 
    getCardsList, 
    getCardDetails, 
    getOtherVersions,
    getCalculatedStats, 
    getPlayerSuggestions, 
    smartSearchCards, 
    addPlayer, 
    addCard, 
    updateCard,
    updatePlayerModel,
    addStats, 
    deletePlayer, 
    deleteCard,
    addManager, 
    getManagersList, 
    deleteManager,
    updatePlayerStatus,
    getPlayerValueHistory,
    comparePlayers,
    getPenalties,
    getSimilarPlayers,
    getTopRatedCards,
    getTopGoalScorers,
    getInjuryPronePlayers,
    getConsistentPlayers,
    getRecentTopForms,
    getTopAvgMarketValue
};