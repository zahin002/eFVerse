const express = require('express');
const router = express.Router();
const progressionController = require('../controllers/progressionController');
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/rules', progressionController.getProgressionRules);

router.get('/my-build/:id', verifyToken, progressionController.getSavedBuild);
router.get('/builds/:cardId', verifyToken, progressionController.getSavedBuildsList);
router.get('/community-builds/:cardId', verifyToken, progressionController.getCommunityBuilds);
router.get('/top-liked-builds', progressionController.getMostLikedBuilds);

router.get('/managers-with-effects', verifyToken, progressionController.getManagersWithEffects);
router.get('/positions', progressionController.getPositions);
router.get('/rules', progressionController.getProgressionRules);


router.post('/train', verifyToken, progressionController.trainCard);
router.post('/save-snapshot', verifyToken, progressionController.saveBuildSnapshot);
router.post('/react', verifyToken, progressionController.reactToBuild);

module.exports = router;