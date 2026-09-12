const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const pool = require('../db');

const getErrorMessage = (error) => {
    if (error?.message) {
        return error.message;
    }

    if (Array.isArray(error?.errors) && error.errors.length > 0) {
        return error.errors
            .map((nestedError) => {
                const code = nestedError.code || 'ERROR';
                const address = nestedError.address ? ` ${nestedError.address}` : '';
                const port = nestedError.port ? `:${nestedError.port}` : '';
                return `${code}${address}${port}`;
            })
            .join(', ');
    }

    if (error?.code) {
        return error.code;
    }

    return 'Unknown server error';
};

const sendServerError = (res, label, error) => {
    console.error(`❌ ${label}:`, error);

    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : getErrorMessage(error);

    res.status(500).json({ error: message });
};

const health = async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        sendServerError(res, 'Database Health Error', error);
    }
};

const getUserProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT UserID, Username, Role FROM "User" WHERE UserID = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        sendServerError(res, 'Get Profile Error', error);
    }
};

const register = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
    }

    let client;

    try {
        client = await pool.connect();
        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query('BEGIN');

        const sql = `
            INSERT INTO "User" (username, email, passwordhash, role) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const values = [username, email, hashedPassword, role || 'USER'];
        
        const result = await client.query(sql, values);

        await client.query('COMMIT');

        console.log("✅ User Registered:", result.rows[0]);
        res.json({ message: "User registered successfully!", user: result.rows[0] });

    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        
        console.error("❌ Register Error:", err.message);

        if (err.code === '23505') {
            return res.status(400).json({ error: "Username or Email already exists" });
        }
        sendServerError(res, 'Register Error', err);

    } finally {
        if (client) {
            client.release();
        }
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const sql = `SELECT * FROM "User" WHERE username = $1`;
        const result = await pool.query(sql, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "User not found" });
        }

        const user = result.rows[0];

        const match = await bcrypt.compare(password, user.passwordhash);

        if (match) {
            console.log("✅ Login Successful for:", user.username);

            const token = jwt.sign(
                { userId: user.userid, role: user.role }, 
                process.env.JWT_SECRET,                   
                { expiresIn: '24h' }                     
            );

            
            res.cookie('token', token, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'lax', 
                path: '/',       
                maxAge: 24 * 60 * 60 * 1000 
            });

         
            res.json({
                message: "Login Successful!",
                user: {
                    userid: user.userid,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ error: "Invalid Password" });
        }

    } catch (err) {
        sendServerError(res, 'Login Error', err);
    }
};


const googleAuth = async (req, res) => {
    const { email, name } = req.body;

    const userEmail = email || (name ? `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com` : null);

    if (!userEmail) {
        return res.status(400).json({ error: "Google email is required" });
    }

    try {
        const sql = `SELECT * FROM "User" WHERE email = $1 OR username = $2`;
        let result = await pool.query(sql, [userEmail, name || userEmail.split('@')[0]]);

        let user;
        if (result.rows.length === 0) {
            const username = name || userEmail.split('@')[0];
            const hashedPassword = await bcrypt.hash('GOOGLE_OAUTH_' + Date.now(), 10);
            
            const insertSql = `
                INSERT INTO "User" (username, email, passwordhash, role)
                VALUES ($1, $2, $3, 'USER')
                RETURNING *
            `;
            const insertRes = await pool.query(insertSql, [username, userEmail, hashedPassword]);
            user = insertRes.rows[0];
            console.log("✅ Google Sign-In: Created new user", user.username);
        } else {
            user = result.rows[0];
            console.log("✅ Google Sign-In: Existing user logged in", user.username);
        }

        const token = jwt.sign(
            { userId: user.userid, role: user.role }, 
            process.env.JWT_SECRET,                   
            { expiresIn: '24h' }                     
        );

        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            path: '/',       
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.json({
            message: "Google Sign-In Successful!",
            user: {
                userid: user.userid,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        sendServerError(res, 'Google Auth Error', err);
    }
};

const logout = (req, res) => {
    res.clearCookie('token', { path: '/' }); 
    res.json({ message: "Logged out successfully!" });
};


module.exports = { register, login, googleAuth, getUserProfile, logout, health };
