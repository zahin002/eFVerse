const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/types', formController.getFormTypes);           
router.get('/history/:id', formController.getPlayerFormHistory); 


router.post('/update', verifyToken, formController.updatePlayerForm);     

module.exports = router;