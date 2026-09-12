const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/list', managerController.listManagers);
router.get('/stats', managerController.getStatTypes);
router.get('/boosts/:id', managerController.getManagerBoosts);


router.post('/add', verifyToken, managerController.addManager);
router.put('/update/:id', verifyToken, managerController.updateManager);
router.post('/boosts', verifyToken, managerController.assignManagerBoosts);
router.delete('/delete/:id', verifyToken, managerController.deleteManager);


module.exports = router;