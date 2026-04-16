const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/pharmacy/:pharmacyId", reviewController.getReviews);

router.post("/pharmacy/:pharmacyId", protect, reviewController.createReview);

module.exports = router;
