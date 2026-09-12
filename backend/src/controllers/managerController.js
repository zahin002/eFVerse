const pool = require('../db');

const STAT_NAME_MAP = {
    'Speed': 'Speed',
    'Ball Control': 'BallControl',
    'BallControl': 'BallControl',
    'Finishing': 'Finishing',
    'Attacking Awareness': 'OffensiveAwareness',
    'Offensive Awareness': 'OffensiveAwareness',
    'OffensiveAwareness': 'OffensiveAwareness',
    'Low Pass': 'LowPass',
    'LowPass': 'LowPass',
    'Stamina': 'Stamina',
    'Dribbling': 'Dribbling',
    'Physical Contact': 'PhysicalContact',
    'PhysicalContact': 'PhysicalContact',
    'Kicking Power': 'KickingPower',
    'KickingPower': 'KickingPower',
    'Jumping': 'Jump',
    'Jump': 'Jump',
    'Aggression': 'Aggression',
    'Tight Possession': 'TightPossession',
    'TightPossession': 'TightPossession',
    'Lofted Pass': 'LoftedPass',
    'LoftedPass': 'LoftedPass',
    'Defensive Awareness': 'DefensiveAwareness',
    'DefensiveAwareness': 'DefensiveAwareness',
    'Defensive Engagement': 'DefensiveEngagement',
    'DefensiveEngagement': 'DefensiveEngagement',
    'Acceleration': 'Acceleration',
    'Balance': 'Balance',
    'Heading': 'Heading',
    'Place Kicking': 'PlaceKicking',
    'Curl': 'Curl',
    'Tackling': 'Tackling',
    'Passing': 'Passing'
};

const addManager = async (req, res) => {
    const { 
        managername, 
        playstyle, 
        leagueid, 
        clubid, 
        nationalityid,
        possession_game,
        quick_counter,
        long_ball_counter,
        out_wide,
        long_ball,
        linkup_type,
        linkup_centerpiece,
        linkup_keyman,
        linkup_positions,
        boosts
    } = req.body;
    
    if (!managername) {
        return res.status(400).json({ error: "Manager name is required." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let boostsStr = null;
        if (Array.isArray(boosts) && boosts.length > 0) {
            boostsStr = boosts.map(b => `${b.statName || b.statname} +${b.value || b.boostvalue || 1}`).join(', ');
        } else if (typeof boosts === 'string') {
            boostsStr = boosts;
        }

        const sql = `
            INSERT INTO Manager (
                ManagerName, 
                PlayStyle, 
                LeagueID, 
                ClubID, 
                NationalityID,
                possession_game,
                quick_counter,
                long_ball_counter,
                out_wide,
                long_ball,
                linkup_type,
                linkup_centerpiece,
                linkup_keyman,
                linkup_positions,
                boosts_display
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *;
        `;
        const values = [
            managername, 
            playstyle || 'Possession Game', 
            leagueid ? parseInt(leagueid) : null, 
            clubid ? parseInt(clubid) : null, 
            nationalityid ? parseInt(nationalityid) : null,
            possession_game ? parseInt(possession_game) : 50,
            quick_counter ? parseInt(quick_counter) : 50,
            long_ball_counter ? parseInt(long_ball_counter) : 50,
            out_wide ? parseInt(out_wide) : 50,
            long_ball ? parseInt(long_ball) : 50,
            linkup_type || null,
            linkup_centerpiece || null,
            linkup_keyman || null,
            linkup_positions || null,
            boostsStr
        ];

        const result = await client.query(sql, values);
        const newManager = result.rows[0];

        if (Array.isArray(boosts) && boosts.length > 0) {
            for (let b of boosts) {
                const rawStat = b.statName || b.statname;
                const val = b.value || b.boostvalue || 1;
                if (rawStat) {
                    const canonicalStat = STAT_NAME_MAP[rawStat] || rawStat.replace(/\s+/g, '');
                    await client.query(
                        'INSERT INTO ManagerEffect (ManagerID, StatName, BoostValue) VALUES ($1, $2, $3)',
                        [newManager.managerid, canonicalStat, Math.min(Math.max(parseInt(val), 1), 3)]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: '✅ Manager added successfully!', manager: newManager, id: newManager.managerid });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ SQL Error (Add Manager):", error.message);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

const listManagers = async (req, res) => {
    try {
        const sql = `
            SELECT m.*, l.leaguename, c.clubname, n.countryname 
            FROM Manager m
            LEFT JOIN League l ON m.leagueid = l.leagueid
            LEFT JOIN Club c ON m.clubid = c.clubid
            LEFT JOIN Nationality n ON m.nationalityid = n.nationalityid
            ORDER BY m.managerid ASC
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const deleteManager = async (req, res) => {
    const { id } = req.params;
    
    
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        const sql = 'DELETE FROM Manager WHERE ManagerID = $1';
        const result = await client.query(sql, [parseInt(id)]);

        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Manager not found." });
        }

        
        await client.query('COMMIT');

        res.json({ message: "✅ Manager removed from database successfully." });
    } catch (error) {
        
        await client.query('ROLLBACK');
        console.error("Delete Transaction Error:", error);
        res.status(500).json({ error: "Database error: Could not delete manager. Check for linked squad dependencies." });
    } finally {
        
        client.release();
    }
};

const getStatTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT StatName FROM StatType ORDER BY StatName ASC');
        res.json(result.rows);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
};


const assignManagerBoosts = async (req, res) => {
    const { 
        managerid, 
        boosts,
        linkup_type,
        linkup_centerpiece,
        linkup_keyman,
        linkup_positions
    } = req.body; 

    if (!managerid) return res.status(400).json({ error: "Manager ID is required." });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query('DELETE FROM ManagerEffect WHERE ManagerID = $1', [parseInt(managerid)]);

        let boostsStr = null;
        if (Array.isArray(boosts) && boosts.length > 0) {
            boostsStr = boosts.map(b => `${b.statName || b.statname} +${b.value || b.boostvalue || 1}`).join(', ');
            for (let boost of boosts) {
                const rawStat = boost.statName || boost.statname;
                const val = boost.value || boost.boostvalue || 1;
                if (rawStat) {
                    const canonicalStat = STAT_NAME_MAP[rawStat] || rawStat.replace(/\s+/g, '');
                    const boostValue = Math.min(Math.max(parseInt(val), 1), 3);
                    await client.query(
                        'INSERT INTO ManagerEffect (ManagerID, StatName, BoostValue) VALUES ($1, $2, $3)',
                        [parseInt(managerid), canonicalStat, boostValue]
                    );
                }
            }
        }

        // Also update Manager table with link-up details and boosts display string
        await client.query(`
            UPDATE Manager SET
                boosts_display = $1,
                linkup_type = COALESCE($2, linkup_type),
                linkup_centerpiece = COALESCE($3, linkup_centerpiece),
                linkup_keyman = COALESCE($4, linkup_keyman),
                linkup_positions = COALESCE($5, linkup_positions)
            WHERE ManagerID = $6
        `, [
            boostsStr, 
            linkup_type || null, 
            linkup_centerpiece || null, 
            linkup_keyman || null, 
            linkup_positions || null, 
            parseInt(managerid)
        ]);

        await client.query('COMMIT');
        res.json({ message: "✅ Manager Booster & Link-Up assigned successfully!" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Assign Boosts Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

const getManagerBoosts = async (req, res) => {
    try {
        const sql = `SELECT StatName, BoostValue FROM ManagerEffect WHERE ManagerID = $1`;
        const result = await pool.query(sql, [req.params.id]);
        res.json(result.rows);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
};



const updateManager = async (req, res) => {
    const { id } = req.params;
    const {
        managername,
        playstyle,
        leagueid,
        clubid,
        nationalityid,
        possession_game,
        quick_counter,
        long_ball_counter,
        out_wide,
        long_ball,
        linkup_type,
        linkup_centerpiece,
        linkup_keyman,
        linkup_positions,
        boosts
    } = req.body;

    if (!managername || !playstyle) {
        return res.status(400).json({ error: "Manager Name and Playstyle are required." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let boostsStr = null;
        if (Array.isArray(boosts) && boosts.length > 0) {
            boostsStr = boosts.map(b => `${b.statName || b.statname} +${b.value || b.boostvalue || 1}`).join(', ');
        }

        const sql = `
            UPDATE Manager SET
                ManagerName = $1,
                Playstyle = $2,
                LeagueID = $3,
                ClubID = $4,
                NationalityID = $5,
                possession_game = $6,
                quick_counter = $7,
                long_ball_counter = $8,
                out_wide = $9,
                long_ball = $10,
                linkup_type = $11,
                linkup_centerpiece = $12,
                linkup_keyman = $13,
                linkup_positions = $14,
                boosts_display = COALESCE($15, boosts_display)
            WHERE ManagerID = $16
            RETURNING *;
        `;
        const values = [
            managername,
            playstyle,
            leagueid ? parseInt(leagueid) : null,
            clubid ? parseInt(clubid) : null,
            nationalityid ? parseInt(nationalityid) : null,
            parseInt(possession_game) || 50,
            parseInt(quick_counter) || 50,
            parseInt(long_ball_counter) || 50,
            parseInt(out_wide) || 50,
            parseInt(long_ball) || 50,
            linkup_type || null,
            linkup_centerpiece || null,
            linkup_keyman || null,
            linkup_positions || null,
            boostsStr,
            parseInt(id)
        ];

        const result = await client.query(sql, values);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Manager not found." });
        }

        // If boosts array is explicitly provided, replace ManagerEffect rows
        if (Array.isArray(boosts)) {
            await client.query('DELETE FROM ManagerEffect WHERE ManagerID = $1', [parseInt(id)]);
            for (let boost of boosts) {
                const rawStat = boost.statName || boost.statname;
                const val = boost.value || boost.boostvalue || 1;
                if (rawStat) {
                    const canonicalStat = STAT_NAME_MAP[rawStat] || rawStat.replace(/\s+/g, '');
                    const boostValue = Math.min(Math.max(parseInt(val), 1), 3);
                    await client.query(
                        'INSERT INTO ManagerEffect (ManagerID, StatName, BoostValue) VALUES ($1, $2, $3)',
                        [parseInt(id), canonicalStat, boostValue]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: "✅ Manager updated successfully!", manager: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Update Manager Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

module.exports = {
    addManager,
    updateManager,
    listManagers,
    deleteManager,
    getStatTypes,
    assignManagerBoosts,
    getManagerBoosts
};