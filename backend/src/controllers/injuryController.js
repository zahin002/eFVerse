const pool = require('../db');



const getInjuryTypes = async (req, res) => {
    try {
        
        const result = await pool.query('SELECT * FROM InjuryType ORDER BY DefaultMultiplier DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};


const getPlayerInjuryHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT ir.*, it.InjuryName, it.DefaultMultiplier 
            FROM InjuryRecord ir
            JOIN InjuryType it ON ir.InjuryTypeID = it.InjuryTypeID
            WHERE ir.PlayerID = $1
            ORDER BY ir.StartDate DESC
        `;
        const result = await pool.query(sql, [id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};


const updatePlayerInjury = async (req, res) => {
    
    const playerId = req.body.playerId || req.body.playerid;
    const injuryTypeId = req.body.injuryTypeId || req.body.injurytypeid;

    if (!playerId) {
        return res.status(400).json({ error: "Player ID is missing" });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        
        const closeSql = `
            UPDATE InjuryRecord 
            SET EndDate = CURRENT_TIMESTAMP, Status = 'Recovered'
            WHERE PlayerID = $1 AND Status = 'Active'
        `;
        await client.query(closeSql, [playerId]);

        
        
        if (injuryTypeId && injuryTypeId != '0') {
            const insertSql = `
                INSERT INTO InjuryRecord (PlayerID, InjuryTypeID, StartDate, Status)
                VALUES ($1, $2, CURRENT_TIMESTAMP, 'Active')
            `;
            await client.query(insertSql, [playerId, injuryTypeId]);
            await client.query('COMMIT');
            
            console.log(`✅ Injury Updated for Player ${playerId}: Type ${injuryTypeId}`);
            res.json({ message: "✅ New Injury Recorded." });
        } else {
            
            await client.query('COMMIT');
            console.log(`✅ Player ${playerId} marked as Healthy.`);
            res.json({ message: "✅ Player marked as Healthy (Active injuries cleared)." });
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Injury Update Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};
module.exports = { getInjuryTypes, getPlayerInjuryHistory, updatePlayerInjury };