const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  
    const token = req.cookies ? req.cookies.token : null; 

    if (!token) {
        console.warn(" [Auth] No token found in request cookies.");
        return res.status(401).json({ error: "Session expired or unauthorized. Please log in again." });
    }

    try {
   
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = {
            userid: verified.userId || verified.userid,
            role: verified.role
        };
        
        next(); 
    } catch (err) {
        console.error(" [Auth] JWT Verification Error:", err.message);
      
        res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    }
};

const optionalVerifyToken = (req, res, next) => {
    const token = req.cookies ? req.cookies.token : null; 
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            userid: verified.userId || verified.userid,
            role: verified.role
        };
    } catch (err) {
        req.user = null;
    }
    next();
};

module.exports = { verifyToken, optionalVerifyToken };