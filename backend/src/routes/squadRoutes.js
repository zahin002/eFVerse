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



// Squad CRUD & Community routes
router.post('/save', optionalVerifyToken, squadController.saveSquad);
router.get('/user/:userId', optionalVerifyToken, squadController.getUserSquads);
router.get('/:squadId', optionalVerifyToken, squadController.getSquadDetails);
router.put('/:squadId', optionalVerifyToken, squadController.updateSquad);
router.delete('/:squadId', optionalVerifyToken, squadController.deleteSquad);
router.post('/:squadId/favorite', optionalVerifyToken, squadController.toggleFavorite);
router.post('/:squadId/share', optionalVerifyToken, squadController.shareSquadToCommunity);
router.post('/:squadId/unshare', optionalVerifyToken, squadController.unshareSquad);

module.exports = router;