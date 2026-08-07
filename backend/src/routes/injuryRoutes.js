const express = require('express');
const router = express.Router();
const injuryController = require('../controllers/injuryController');
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/types', injuryController.getInjuryTypes);           
router.get('/history/:id', injuryController.getPlayerInjuryHistory); 

router.post('/update', verifyToken, injuryController.updatePlayerInjury); 

module.exports = router;