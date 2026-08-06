const pool = require('../db');



const addManager = async (req, res) => {
    const { managername, playstyle, leagueid, clubid, nationalityid } = req.body;
    
    
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        const sql = `SELECT * FROM insert_manager_sql($1, $2, $3, $4, $5)`;
        const values = [
            managername, 
            playstyle, 
            leagueid ? parseInt(leagueid) : null, 
            clubid ? parseInt(clubid) : null, 
            nationalityid ? parseInt(nationalityid) : null
        ];

        
        const result = await client.query(sql, values);

        
        await client.query('COMMIT');

        res.json(result.rows[0]);
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
            ORDER BY m.managerid DESC
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
    const { managerid, boosts } = req.body; 
    

    if (!managerid) return res.status(400).json({ error: "Manager ID is required." });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        
        await client.query('DELETE FROM ManagerEffect WHERE ManagerID = $1', [parseInt(managerid)]);

        
        for (let boost of boosts) {
            if (boost.statName && boost.value) {
                
                const boostValue = Math.min(Math.max(parseInt(boost.value), 1), 3);
                
                await client.query(
                    'INSERT INTO ManagerEffect (ManagerID, StatName, BoostValue) VALUES ($1, $2, $3)',
                    [parseInt(managerid), boost.statName, boostValue]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: "✅ Manager boosts assigned successfully!" });
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



module.exports = {
    addManager,
    listManagers,
    deleteManager,
    getStatTypes,
    assignManagerBoosts,
    getManagerBoosts
};