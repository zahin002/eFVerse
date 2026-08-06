const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/:cardId', reviewController.getReviews); 


router.post('/add', verifyToken, reviewController.addReview);     

module.exports = router;