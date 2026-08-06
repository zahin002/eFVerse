const pool = require('../db');



const trainCard = async (req, res) => {
    const { cardId, points } = req.body;
    

    const userId = req.user ? (req.user.userid || req.user.userId) : null;
    
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in session." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

       
        const cardCheckSql = `
            SELECT TotalProgressionPoints 
            FROM Card 
            WHERE CardID = $1
        `;
        const cardRes = await client.query(cardCheckSql, [cardId]);

        if (cardRes.rows.length === 0) {
            throw new Error("Card not found.");
        }

        const totalAllowed = cardRes.rows[0].totalprogressionpoints || 0;
        const totalUsed = Object.values(points).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

        if (totalUsed > totalAllowed) {
            throw new Error(`Insufficient points! Max allowed: ${totalAllowed}, Attempted to use: ${totalUsed}`);
        }

     
        const trainSql = `
            CALL train_player_card_pro(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )
        `;

        await client.query(trainSql, [
            cardId,
            points.shooting || 0,
            points.passing || 0,
            points.dribbling || 0,
            points.dexterity || 0,
            points.lowerBody || 0,
            points.aerial || 0,
            points.defending || 0,
            points.gk1 || 0,
            points.gk2 || 0,
            points.gk3 || 0
        ]);


        const saveBuildSql = `
            CALL save_player_build_pro(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
        `;
        
        await client.query(saveBuildSql, [
            userId,
            cardId,
            points.shooting || 0,
            points.passing || 0,
            points.dribbling || 0,
            points.dexterity || 0,
            points.lowerBody || 0,
            points.aerial || 0,
            points.defending || 0,
            points.gk1 || 0,
            points.gk2 || 0,
            points.gk3 || 0
        ]);

        await client.query('COMMIT');
        res.json({ message: "✅ Training confirmed! Build saved and stats updated successfully." });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Progression Controller Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};


const saveBuildSnapshot = async (req, res) => {
    
    const { cardId, buildName, points, isPublic } = req.body;
    const userId = req.user ? (req.user.userid || req.user.userId) : null;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (!buildName || buildName.trim() === "") {
        return res.status(400).json({ error: "Build name is required." });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        
        const buildRes = await client.query(
            `INSERT INTO Build (UserID, CardID, BuildName, IsPublic) 
             VALUES ($1, $2, $3, $4) RETURNING BuildID`,
            
            [userId, cardId, buildName, isPublic || false]
        );
        const newBuildId = buildRes.rows[0].buildid;

      
        await client.query(
            `INSERT INTO BuildStats (
                BuildID, Finishing, Passing, Dribbling, OffensiveAwareness, 
                Speed, Jump, DefensiveAwareness, GkAwareness, GkCatching, GkParrying
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                newBuildId, 
                points.shooting || 0, 
                points.passing || 0, 
                points.dribbling || 0, 
                points.dexterity || 0,
                points.lowerBody || 0, 
                points.aerial || 0, 
                points.defending || 0, 
                points.gk1 || 0,
                points.gk2 || 0, 
                points.gk3 || 0
            ]
        );

        await client.query('COMMIT');
        res.json({ message: `✅ Snapshot '${buildName}' saved to your builds!` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Save Snapshot Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};


const getProgressionRules = async (req, res) => {
    try {
        const sql = `
            SELECT tp.ProgramID, tp.ProgramName, pr.StatName, pr.BoostPerPoint 
            FROM TrainingProgram tp
            JOIN ProgressionRule pr ON tp.ProgramID = pr.ProgramID
            ORDER BY tp.ProgramID
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const getSavedBuild = async (req, res) => {
    const { id } = req.params; 
    const userId = req.user ? (req.user.userid || req.user.userId) : null;

    if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      
        const sql = `
            SELECT 
                bs.Finishing AS shooting, 
                bs.Passing AS passing, 
                bs.Dribbling AS dribbling, 
                bs.OffensiveAwareness AS dexterity, 
                bs.Speed AS lowerbody, 
                bs.Jump AS aerial, 
                bs.DefensiveAwareness AS defending, 
                bs.GkAwareness AS gk1, 
                bs.GkCatching AS gk2, 
                bs.GkParrying AS gk3 
            FROM BuildStats bs
            JOIN Build b ON bs.BuildID = b.BuildID
            WHERE b.CardID = $1 AND b.UserID = $2
            ORDER BY b.BuildID DESC
            LIMIT 1
        `;
        const result = await pool.query(sql, [id, userId]);
     
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error("Get Saved Build Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

const getSavedBuildsList = async (req, res) => {
    const { cardId } = req.params;
    const userId = req.user ? (req.user.userid || req.user.userId) : null;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const sql = `
            SELECT b.BuildID, b.BuildName, b.CreatedAt, bs.*
            FROM Build b
            JOIN BuildStats bs ON b.BuildID = bs.BuildID
            WHERE b.CardID = $1 AND b.UserID = $2
            ORDER BY b.CreatedAt DESC
        `;
        const result = await pool.query(sql, [cardId, userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Builds Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};


const getCommunityBuilds = async (req, res) => {
    const { cardId } = req.params;
    const userId = req.user ? (req.user.userid || req.user.userId) : null;

    try {
        const sql = `
            SELECT 
                b.BuildID, b.BuildName, b.CreatedAt, u.Username, bs.*,
                -- Count total likes
                COALESCE(SUM(CASE WHEN br.Reaction = 'LIKE' THEN 1 ELSE 0 END), 0) as likes,
                -- Count total dislikes
                COALESCE(SUM(CASE WHEN br.Reaction = 'DISLIKE' THEN 1 ELSE 0 END), 0) as dislikes,
                -- Identify if the current user has reacted
                MAX(CASE WHEN br.UserID = $2 THEN br.Reaction ELSE NULL END) as my_reaction
            FROM Build b
            JOIN BuildStats bs ON b.BuildID = bs.BuildID
            JOIN "User" u ON b.UserID = u.UserID
            LEFT JOIN BuildReaction br ON b.BuildID = br.BuildID
            WHERE b.CardID = $1 AND b.IsPublic = TRUE
            GROUP BY b.BuildID, u.Username, bs.BuildID
            ORDER BY likes DESC, b.CreatedAt DESC
            LIMIT 20
        `;
        const result = await pool.query(sql, [cardId, userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Community Builds Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

const reactToBuild = async (req, res) => {
    const { buildId, reaction } = req.body; 
    const userId = req.user ? (req.user.userid || req.user.userId) : null;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!['LIKE', 'DISLIKE'].includes(reaction)) return res.status(400).json({ error: "Invalid reaction type." });

    
    const client = await pool.connect();

    try {
       
        await client.query('BEGIN');

     
        const checkSql = `SELECT Reaction FROM BuildReaction WHERE BuildID = $1 AND UserID = $2`;
       
        const checkRes = await client.query(checkSql, [buildId, userId]);

        let responseMessage = "";

        if (checkRes.rows.length > 0) {
            if (checkRes.rows[0].reaction === reaction) {
              
                await client.query(`DELETE FROM BuildReaction WHERE BuildID = $1 AND UserID = $2`, [buildId, userId]);
                responseMessage = "Reaction removed.";
            } else {
            
                await client.query(`UPDATE BuildReaction SET Reaction = $1 WHERE BuildID = $2 AND UserID = $3`, [reaction, buildId, userId]);
                responseMessage = `Reaction changed to ${reaction}.`;
            }
        } else {
          
            await client.query(`INSERT INTO BuildReaction (BuildID, UserID, Reaction) VALUES ($1, $2, $3)`, [buildId, userId, reaction]);
            responseMessage = `Build ${reaction}D.`;
        }

       
        await client.query('COMMIT');
        return res.json({ message: responseMessage });

    } catch (err) {
       
        await client.query('ROLLBACK');
        console.error("Reaction Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        
        client.release();
    }
};

const getMostLikedBuilds = async (req, res) => {
    try {
        const query = `
            SELECT * FROM (
                SELECT 
                    b.BuildID, 
                    b.BuildName, 
                    u.Username AS author,
                    p.PlayerName,
                    c.CardType,
                    c.PositionCode,
                    c.BaseOverallRating,
                    b.CreatedAt,
                  
                    (SELECT COUNT(*)::int FROM BuildReaction br WHERE br.BuildID = b.BuildID AND br.Reaction = 'LIKE') AS total_likes
                FROM Build b
                JOIN "User" u ON b.UserID = u.UserID
                JOIN Card c ON b.CardID = c.CardID
                JOIN Player p ON c.PlayerID = p.PlayerID
                WHERE b.IsPublic = TRUE
            ) AS build_stats
            WHERE total_likes > 0
            ORDER BY total_likes DESC, CreatedAt DESC
            LIMIT 20;
        `;
        
        const { rows } = await pool.query(query);
        res.json(rows);
        
    } catch (err) {
        console.error("Error fetching most liked builds:", err);
        res.status(500).json({ error: "Failed to fetch most liked builds" });
    }
};


const getManagersWithEffects = async (req, res) => {
    try {
        const sql = `
            SELECT 
                m.ManagerID, 
                m.ManagerName, 
                m.Playstyle,
                
                COALESCE(
                    json_agg(json_build_object('statName', LOWER(REPLACE(me.StatName, ' ', '')), 'boost', me.BoostValue)) 
                    FILTER (WHERE me.StatName IS NOT NULL), 
                '[]') as effects
            FROM Manager m
            LEFT JOIN ManagerEffect me ON m.ManagerID = me.ManagerID
            GROUP BY m.ManagerID, m.ManagerName, m.Playstyle
            ORDER BY m.ManagerName
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error("Manager Fetch Error:", err.message);
        res.status(500).json({ error: "Failed to fetch managers" });
    }
};

const getPositions = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Positions');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching positions:", err);
        res.status(500).json({ error: "Failed to load position data" });
    }
};




module.exports = { 
    trainCard, 
    saveBuildSnapshot, 
    getProgressionRules, 
    getSavedBuild, 
    getSavedBuildsList, 
    getCommunityBuilds, 
    reactToBuild, 
    getMostLikedBuilds,
    getManagersWithEffects,
    getPositions
};