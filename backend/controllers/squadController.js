const pool = require('../db');







const getFormations = async (req, res) => {
    try {
        const formations = [
            { name: '4-4-2', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'] },
            { name: '4-3-3', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'ST', 'RW'] },
            { name: '3-5-2', positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'CAM', 'RM', 'ST', 'ST'] },
            { name: '4-2-3-1', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'CAM', 'CAM', 'CAM', 'ST'] },
            { name: '5-3-2', positions: ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'ST', 'ST'] },
            { name: '4-1-4-1', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CM', 'CM', 'RM', 'ST'] },
            { name: '3-4-3', positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'LW', 'ST', 'RW'] },
            { name: '4-5-1', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'CAM', 'RM', 'ST'] }
        ];
        res.json(formations);
    } catch (error) {
        console.error("❌ Get Formations Error:", error);
        res.status(500).json({ error: "Failed to fetch formations" });
    }
};


const getPositions = async (req, res) => {
    try {
        console.log(" Fetching all positions from database...");
        
        const result = await pool.query(`
            SELECT 
                PositionCode,
                RoleGroup
            FROM Positions
            ORDER BY PositionCode
        `);
        
        console.log(`✅ Loaded ${result.rows.length} positions`);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Get Positions Error:", error.message);
        console.error("❌ Full Error:", error);
        res.status(500).json({ 
            error: "Failed to fetch positions",
            details: error.message 
        });
    }
};

const getAllPositionPenalties = async (req, res) => {
    try {
        console.log("📍 Fetching all position penalties from database...");
        const result = await pool.query(`
            SELECT 
                FromPosition,
                ToPosition,
                Penalty
            FROM PositionPenalty
            ORDER BY FromPosition, ToPosition
        `);
        
        console.log(`✅ Loaded ${result.rows.length} position penalties from database`);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Get All Penalties Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const getPositionPenalty = async (req, res) => {
    const { cardId, targetPosition } = req.params;
    
    if (!cardId || !targetPosition) {
        return res.status(400).json({ error: "cardId and targetPosition required" });
    }

    try {
        const cardQuery = await pool.query(
            'SELECT PositionCode FROM Card WHERE CardID = $1',
            [cardId]
        );
        
        if (cardQuery.rows.length === 0) {
            return res.status(404).json({ error: "Card not found" });
        }
        
        const naturalPosition = (cardQuery.rows[0].positioncode || cardQuery.rows[0].PositionCode || '').toUpperCase().trim();
        const targetPos = (targetPosition || '').toUpperCase().trim();
        
        if (naturalPosition === targetPos) {
            return res.json({ 
                penalty: 0,
                message: "Natural position - No penalty"
            });
        }
        
        const penaltyQuery = await pool.query(
            'SELECT Penalty FROM PositionPenalty WHERE FromPosition = $1 AND ToPosition = $2',
            [naturalPosition, targetPos]
        );
        
        if (penaltyQuery.rows.length > 0) {
            const penalty = penaltyQuery.rows[0].penalty || penaltyQuery.rows[0].Penalty;
            return res.json({ 
                penalty: penalty,
                message: `Position change penalty: -${penalty} rating`
            });
        } else {
            return res.json({ 
                penalty: 20, 
                message: "Position mismatch - applying default penalty (-20)"
            });
        }
    } catch (error) {
        console.error("❌ Get Position Penalty Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const getCards = async (req, res) => {
    try {
        console.log("📇 Fetching all player cards with details...");
        
        const result = await pool.query(`
            SELECT 
                c.CardID,
                c.PlayerID,
                c.CardType,
                c.PositionCode,
                c.BaseOverallRating,
                c.CurrentOverallRating,
                c.MaxOverallRating,
                c.TotalProgressionPoints,
                p.PlayerName,
                p.Age,
                p.LeagueID,
                p.ClubID,
                cl.ClubName,
                l.LeagueName,
                n.CountryName as Nationality,
                ps.StatsID,
                ps.OffensiveAwareness,
                ps.Finishing,
                ps.BallControl,
                ps.Dribbling,
                ps.Passing,
                ps.KickingPower,
                ps.Speed,
                ps.Acceleration,
                ps.Stamina,
                ps.Balance,
                ps.PhysicalContact,
                ps.Jump,
                ps.DefensiveAwareness,
                ps.Tackling,
                ps.Aggression,
                ps.GkAwareness,
                ps.GkCatching,
                ps.GkParrying,
                ps.GkReflexes,
                ps.GkReach
            FROM Card c
            INNER JOIN Player p ON c.PlayerID = p.PlayerID
            LEFT JOIN Club cl ON p.ClubID = cl.ClubID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            LEFT JOIN Nationality n ON p.NationalityID = n.NationalityID
            LEFT JOIN PlayerStats ps ON c.CardID = ps.CardID
            ORDER BY c.CurrentOverallRating DESC, p.PlayerName ASC
        `);

        console.log(`✅ Loaded ${result.rows.length} cards from database`);

        
        res.json(result.rows);

    } catch (error) {
        console.error("❌ Get Cards Error:", error.message);
        console.error("❌ Full Error:", error);
        res.status(500).json({ 
            error: "Failed to fetch cards",
            details: error.message 
        });
    }
};







const saveSquad = async (req, res) => {
    const { userId, managerId, squadName, formation, players, teamStrength } = req.body;
    
    console.log("📝 saveSquad called with:", { userId, managerId, squadName, formation, teamStrength, playersCount: players?.length });
    console.log("📝 Players data:", JSON.stringify(players, null, 2));
    
    if (!userId || !managerId || !squadName || !players || players.length === 0) {
        console.error("❌ Missing required fields");
        return res.status(400).json({ error: "Missing required fields: userId, managerId, squadName, players" });
    }

    const client = await pool.connect();
    try {
        console.log("🔄 Starting transaction: saveSquad");
        await client.query('BEGIN');

        
        const squadSql = `
            INSERT INTO squad (userid, managerid, squadname, formation, teamstrength, createdat, updatedat)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING squadid;
        `;
        
        console.log("📝 Inserting squad with:", { userId, managerId, squadName, formation, teamStrength });
        
        const squadRes = await client.query(squadSql, [
            userId, 
            managerId, 
            squadName.trim(), 
            formation || '4-3-3', 
            teamStrength || 0
        ]);
        
        const newSquadId = squadRes.rows[0].squadid;
        console.log("✅ Squad created with ID:", newSquadId);

        
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            
            console.log(`📝 Processing player ${i + 1}:`, { cardId: p.cardId, position: p.position, isStarting: p.isStarting });
            
            if (!p.cardId || !p.position) {
                throw new Error(`Invalid player data at index ${i}: missing cardId or position`);
            }
            
            const playerInsertSql = `
                INSERT INTO squadplayer (squadid, cardid, assignedposition, isstartingxi)
                VALUES ($1, $2, $3, $4)
            `;
            
            await client.query(playerInsertSql, [
                newSquadId, 
                p.cardId, 
                p.position, 
                p.isStarting !== false
            ]);
            
            console.log(`✅ Player ${i + 1} added to squad`);
        }
        
        console.log("✅ Added", players.length, "players to squad");

        await client.query('COMMIT');
        console.log("✅ Transaction COMMITTED successfully");

        res.status(201).json({ 
            success: true, 
            message: "✅ Squad saved successfully!", 
            squadId: newSquadId,
            strength: teamStrength
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Error in transaction, rolling back:", err.message);
        console.error("❌ Full error:", err);
        res.status(500).json({ error: "Failed to save squad: " + err.message });
    } finally {
        client.release();
    }
};

const getUserSquads = async (req, res) => {
    const { userId } = req.params;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID required" });
    }

    try {
        const query = `
            SELECT 
                s.SquadID,
                s.UserID,
                s.ManagerID,
                s.SquadName,
                s.Formation,
                s.TeamStrength,
                s.CreatedAt,
                s.UpdatedAt,
                s.IsFavourite,
                COUNT(sp.CardID) as PlayerCount,
                m.ManagerName,
                m.PlayStyle
            FROM Squad s
            LEFT JOIN SquadPlayer sp ON s.SquadID = sp.SquadID
            LEFT JOIN Manager m ON s.ManagerID = m.ManagerID
            WHERE s.UserID = $1
            GROUP BY s.SquadID, s.UserID, s.ManagerID, s.SquadName, s.Formation, s.TeamStrength, s.CreatedAt, s.UpdatedAt, s.IsFavourite, m.ManagerName, m.PlayStyle
            ORDER BY s.IsFavourite DESC, s.CreatedAt DESC
        `;

        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) { 
        console.error("❌ Get User Squads Error:", err);
        res.status(500).json({ error: err.message }); 
    }
};



const getSquadDetails = async (req, res) => {
    const { squadId } = req.params;
    
    if (!squadId) {
        return res.status(400).json({ error: "Squad ID required" });
    }

    try {
        const sql = `
            SELECT 
                s.squadid,
                s.squadname,
                s.formation,
                s.teamstrength,
                s.createdat,
                s.updatedat,
                s.isfavourite,
                m.managerid,
                m.managername,
                m.playstyle,
                sp.cardid,
                sp.assignedposition,
                sp.isstartingxi,
                c.cardtype,
                c.positioncode as naturalposition,
                c.baseoverallrating,
                c.currentoverallrating,
                c.maxoverallrating,
                p.playerid,
                p.playername,
                p.age,
                ps.offensiveawareness,
                ps.finishing,
                ps.ballcontrol,
                ps.dribbling,
                ps.passing,
                ps.kickingpower,
                ps.speed,
                ps.acceleration,
                ps.stamina,
                ps.balance,
                ps.physicalcontact,
                ps.jump,
                ps.defensiveawareness,
                ps.tackling,
                ps.aggression,
                ps.gkawareness,
                ps.gkcatching,
                ps.gkparrying,
                ps.gkreflexes,
                ps.gkreach
            FROM squad s
            LEFT JOIN manager m ON s.managerid = m.managerid
            LEFT JOIN squadplayer sp ON s.squadid = sp.squadid
            LEFT JOIN card c ON sp.cardid = c.cardid
            LEFT JOIN player p ON c.playerid = p.playerid
            LEFT JOIN playerstats ps ON c.cardid = ps.cardid
            WHERE s.squadid = $1
            ORDER BY sp.isstartingxi DESC, sp.cardid
        `;
        
        const result = await pool.query(sql, [squadId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Squad not found" });
        }

        const squadInfo = {
            squadId: result.rows[0].squadid,
            squadName: result.rows[0].squadname,
            formation: result.rows[0].formation,
            teamStrength: result.rows[0].teamstrength,
            isFavourite: result.rows[0].isfavourite,
            createdAt: result.rows[0].createdat,
            updatedAt: result.rows[0].updatedat,
            manager: {
                managerId: result.rows[0].managerid,
                managerName: result.rows[0].managername,
                playStyle: result.rows[0].playstyle
            },
            players: result.rows
                .filter(row => row.cardid)
                .map(row => ({
                    cardId: row.cardid,
                    playerId: row.playerid,
                    playerName: row.playername,
                    age: row.age,
                    cardType: row.cardtype,
                    naturalPosition: row.naturalposition,
                    assignedPosition: row.assignedposition,
                    baseOverallRating: row.baseoverallrating,
                    currentOverallRating: row.currentoverallrating,
                    maxOverallRating: row.maxoverallrating,
                    isStartingXI: row.isstartingxi,
                    stats: {
                        offensiveAwareness: row.offensiveawareness,
                        finishing: row.finishing,
                        ballControl: row.ballcontrol,
                        dribbling: row.dribbling,
                        passing: row.passing,
                        kickingPower: row.kickingpower,
                        speed: row.speed,
                        acceleration: row.acceleration,
                        stamina: row.stamina,
                        balance: row.balance,
                        physicalContact: row.physicalcontact,
                        jump: row.jump,
                        defensiveAwareness: row.defensiveawareness,
                        tackling: row.tackling,
                        aggression: row.aggression,
                        gkAwareness: row.gkawareness,
                        gkCatching: row.gkcatching,
                        gkParrying: row.gkparrying,
                        gkReflexes: row.gkreflexes,
                        gkReach: row.gkreach
                    }
                }))
        };

        res.json(squadInfo);
    } catch (error) {
        console.error("❌ Get Squad Details Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const updateSquad = async (req, res) => {
    const { squadId } = req.params;
    const { squadName, formation, players, teamStrength } = req.body;

    if (!squadId) {
        return res.status(400).json({ error: "Squad ID required" });
    }

    if (!squadName || !players || players.length === 0) {
        return res.status(400).json({ error: "Squad name and players are required" });
    }

    const client = await pool.connect();
    try {
        console.log("🔄 Starting transaction: updateSquad for ID:", squadId);
        await client.query('BEGIN');

        const updateSql = `
            UPDATE squad 
            SET squadname = $1, formation = $2, teamstrength = $3, updatedat = CURRENT_TIMESTAMP
            WHERE squadid = $4
            RETURNING squadid
        `;
        const updateRes = await client.query(updateSql, [squadName.trim(), formation || '4-3-3', teamStrength || 0, squadId]);

        if (updateRes.rows.length === 0) {
            throw new Error("Squad not found");
        }
        console.log("✅ Squad updated");

        await client.query('DELETE FROM squadplayer WHERE squadid = $1', [squadId]);
        console.log("✅ Old players deleted");

        for (let p of players) {
            if (!p.cardId || !p.position) {
                throw new Error("Invalid player data: missing cardId or position");
            }
            await client.query(`
                INSERT INTO squadplayer (squadid, cardid, assignedposition, isstartingxi)
                VALUES ($1, $2, $3, $4)
            `, [squadId, p.cardId, p.position, p.isStarting !== false]);
        }
        console.log("✅ Added", players.length, "new players");

        await client.query('COMMIT');
        console.log("✅ Transaction COMMITTED successfully");

        res.json({ 
            success: true, 
            message: "✅ Squad updated successfully!", 
            squadId
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Error in transaction, rolling back:", err.message);
        res.status(500).json({ error: "Failed to update squad: " + err.message });
    } finally {
        client.release();
    }
};


const deleteSquad = async (req, res) => {
    const { squadId } = req.params;

    if (!squadId) {
        return res.status(400).json({ error: "Squad ID required" });
    }

    const client = await pool.connect();
    try {
        console.log("🔄 Starting transaction: deleteSquad for ID:", squadId);
        await client.query('BEGIN');

        const result = await client.query(
            'DELETE FROM squad WHERE squadid = $1 RETURNING squadid',
            [squadId]
        );

        if (result.rows.length === 0) {
            throw new Error("Squad not found");
        }
        console.log("✅ Squad deleted with ID:", squadId);

        await client.query('COMMIT');
        console.log("✅ Transaction COMMITTED successfully");

        res.json({ 
            success: true, 
            message: "✅ Squad deleted successfully!" 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Error in transaction, rolling back:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};


const toggleFavorite = async (req, res) => {
    const { squadId } = req.params;

    if (!squadId) {
        return res.status(400).json({ error: "Squad ID required" });
    }

    const client = await pool.connect();
    try {
        console.log("🔄 Starting transaction: toggleFavorite for ID:", squadId);
        await client.query('BEGIN');

        const result = await client.query(
            'UPDATE squad SET isfavourite = NOT isfavourite WHERE squadid = $1 RETURNING squadid, isfavourite',
            [squadId]
        );

        if (result.rows.length === 0) {
            throw new Error("Squad not found");
        }

        const isFav = result.rows[0].isfavourite;
        console.log(`✅ Squad favorite status toggled to: ${isFav}`);

        await client.query('COMMIT');
        console.log("✅ Transaction COMMITTED successfully");

        res.json({
            success: true,
            message: isFav ? "⭐ Added to favorites!" : "Removed from favorites!",
            isFavourite: isFav
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Error in transaction, rolling back:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};



module.exports = { 
    
    getFormations,
    getPositions,
    getAllPositionPenalties,
    getPositionPenalty,
    getCards,  
    
    
    saveSquad,
    getUserSquads,
    getSquadDetails,
    updateSquad,
    deleteSquad,
    toggleFavorite
};