const express = require('express');
const router = express.Router();
const controller = require('../controllers/playerController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/helpers', controller.getHelpers);
router.get('/clubs-by-league', controller.getClubsByLeague);
router.get('/list-players', controller.getPlayersList);
router.get('/list-cards', controller.getCardsList);
router.get('/suggestions', controller.getPlayerSuggestions);
router.get('/smart-search', controller.smartSearchCards);
router.get('/compare/:cardId1/:cardId2', controller.comparePlayers);
router.get('/calculate-stats/:id', controller.getCalculatedStats);
router.get('/list-penalties', controller.getPenalties);
router.get('/view-card/:id', controller.getCardDetails);
router.get('/history/:playerId', controller.getPlayerValueHistory);
router.get('/similar/:cardId', controller.getSimilarPlayers);
router.get('/top-rated', controller.getTopRatedCards);
router.get('/top-scorers', controller.getTopGoalScorers);
router.get('/injury-prone', controller.getInjuryPronePlayers);
router.get('/consistent', controller.getConsistentPlayers);
router.get('/recent-hot-form', controller.getRecentTopForms);
router.get('/top-market-value', controller.getTopAvgMarketValue);


router.post('/add-player', verifyToken, controller.addPlayer);
router.post('/add-card', verifyToken, controller.addCard);
router.post('/add-stats', verifyToken, controller.addStats);


router.put('/update-status', verifyToken, controller.updatePlayerStatus);


router.delete('/delete-player/:id', verifyToken, controller.deletePlayer);
router.delete('/delete-card/:id', verifyToken, controller.deleteCard);

module.exports = router;