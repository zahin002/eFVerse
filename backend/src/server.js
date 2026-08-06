const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); 

console.log("------------------------------------------------");
console.log("🔍 SERVER CHECK:");
console.log("Current Directory:", __dirname);
console.log("Looking for .env at:", path.resolve(__dirname, '../.env'));

if (process.env.DATABASE_URL) {
    console.log("✅ Database URL Found:", process.env.DATABASE_URL.substring(0, 20) + "...");
} else {
    console.log("❌ ERROR: Database URL is MISSING! Please check:");
    console.log("   1. Does 'backend/.env' exist?");
    console.log("   2. Does it contain 'DATABASE_URL=...'?");
}
console.log("------------------------------------------------");

const app = express();

// 1. CORS Configuration (Keep this first)
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// 2. Global Middlewares
app.use(express.json());
app.use(cookieParser()); // Enable reading of JWT from cookies

app.get('/', (req, res) => {
    res.json({
        message: 'FHUB backend is running',
        frontend: 'http://localhost:5173',
        api: {
            auth: '/api/auth',
            players: '/api/players',
            managers: '/api/managers',
            forms: '/api/forms',
            injuries: '/api/injuries',
            reviews: '/api/reviews',
            squads: '/api/squads',
            progression: '/api/progression'
        }
    });
});

// 4. Route Definitions
const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const managerRoutes = require('./routes/managerRoutes');
const formRoutes = require('./routes/formRoutes');
const injuryRoutes = require('./routes/injuryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const squadRoutes = require('./routes/squadRoutes'); 
const progressionRoutes = require('./routes/progressionRoutes'); 

app.use('/api/auth', authRoutes); 
app.use('/api/progression', progressionRoutes); 
app.use('/api/players', playerRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/injuries', injuryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/squads', squadRoutes);               

// 5. Server Initialization
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`✅ Progression API active at: http://localhost:${PORT}/api/progression/train`);
});
