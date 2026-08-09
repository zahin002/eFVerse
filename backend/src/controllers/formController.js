const pool = require('../db');



const getFormTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM FormType ORDER BY Multiplier DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};


const getPlayerFormHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT pf.*, ft.FormName, ft.Multiplier 
            FROM PlayerForm pf
            JOIN FormType ft ON pf.FormTypeID = ft.FormTypeID
            WHERE pf.PlayerID = $1
            ORDER BY pf.StartDate DESC
        `;
        const result = await pool.query(sql, [id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};


const updatePlayerForm = async (req, res) => {
    const { playerid, formtypeid } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        
        const closeSql = `
            UPDATE PlayerForm 
            SET EndDate = CURRENT_TIMESTAMP 
            WHERE PlayerID = $1 AND EndDate IS NULL
        `;
        await client.query(closeSql, [playerid]);

        
        const insertSql = `
            INSERT INTO PlayerForm (PlayerID, FormTypeID, StartDate)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
        `;
        await client.query(insertSql, [playerid, formtypeid]);

        await client.query('COMMIT');
        res.json({ message: "✅ Player form updated successfully!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

module.exports = { getFormTypes, getPlayerFormHistory, updatePlayerForm };