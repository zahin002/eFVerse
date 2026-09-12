const express = require('express');
const router = express.Router();
const squadController = require('../controllers/squadController');
const { verifyToken, optionalVerifyToken } = require('../middleware/authMiddleware');




// Public routes
router.get('/formations', squadController.getFormations);
router.get('/cards', squadController.getCards);
router.get('/positions', squadController.getPositions);
router.get('/penalties-all', squadController.getAllPositionPenalties);
router.get('/penalties/:cardId/:targetPosition', squadController.getPositionPenalty);

// Community routes (public read, auth for write)
router.get('/community/all', optionalVerifyToken, squadController.getCommunitySquads);



// Auth-protected routes
router.post('/save', verifyToken, squadController.saveSquad);
router.get('/user/:userId', verifyToken, squadController.getUserSquads);
router.get('/:squadId', verifyToken, squadController.getSquadDetails);
router.put('/:squadId', verifyToken, squadController.updateSquad);
router.delete('/:squadId', verifyToken, squadController.deleteSquad);
router.post('/:squadId/favorite', verifyToken, squadController.toggleFavorite);
router.post('/:squadId/share', verifyToken, squadController.shareSquadToCommunity);
router.post('/:squadId/unshare', verifyToken, squadController.unshareSquad);

module.exports = router;