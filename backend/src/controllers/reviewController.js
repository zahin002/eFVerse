const pool = require('../db');



const getReviews = async (req, res) => {
    const { cardId } = req.params;
    try {
        
        const sql = `
            SELECT r.*, u.Username 
            FROM Review r
            JOIN "User" u ON r.UserID = u.UserID
            WHERE r.CardID = $1 
            ORDER BY r.LastUpdated DESC
        `;
        const result = await pool.query(sql, [cardId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Get Reviews Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const addReview = async (req, res) => {
    const { userId, cardId, matchesPlayed, matchesWon, goals, assists, cleanSheets, averageRating } = req.body;


    const client = await pool.connect();

    try {
      
        await client.query('BEGIN');
        
        const sql = `
            INSERT INTO Review (UserID, CardID, MatchesPlayed, MatchesWon, Goals, Assists, CleanSheets, AverageRating, LastUpdated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            ON CONFLICT (UserID, CardID) 
            DO UPDATE SET 
                MatchesPlayed = EXCLUDED.MatchesPlayed,
                MatchesWon = EXCLUDED.MatchesWon,
                Goals = EXCLUDED.Goals,
                Assists = EXCLUDED.Assists,
                CleanSheets = EXCLUDED.CleanSheets,
                AverageRating = EXCLUDED.AverageRating,
                LastUpdated = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        
        const values = [userId, cardId, matchesPlayed, matchesWon, goals, assists, cleanSheets, averageRating];
        
        
        const result = await client.query(sql, values);
        
      
        await client.query('COMMIT');
        
        res.json({ success: true, review: result.rows[0] });

    } catch (error) {
        
        await client.query('ROLLBACK');
        console.error("Add Review Error:", error);
        res.status(500).json({ error: error.message });

    } finally {
        
        client.release();
    }
};

module.exports = { getReviews, addReview };