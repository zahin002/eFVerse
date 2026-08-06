
const express = require('express');
const router = express.Router();
const squadController = require('../controllers/squadController');
const { verifyToken } = require('../middleware/authMiddleware');






router.get('/formations', squadController.getFormations);
router.get('/cards', squadController.getCards);
router.get('/positions', squadController.getPositions);
router.get('/penalties-all', squadController.getAllPositionPenalties);
router.get('/penalties/:cardId/:targetPosition', squadController.getPositionPenalty);






router.post('/save', verifyToken, squadController.saveSquad);
router.get('/user/:userId', verifyToken, squadController.getUserSquads);
router.get('/:squadId', verifyToken, squadController.getSquadDetails);
router.put('/:squadId', verifyToken, squadController.updateSquad);
router.delete('/:squadId', verifyToken, squadController.deleteSquad);
router.post('/:squadId/favorite', verifyToken, squadController.toggleFavorite);

module.exports = router;