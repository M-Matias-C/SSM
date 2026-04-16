const reviewService = require("../services/reviewService");

async function getReviews(req, res, next) {
  try {
    const { pharmacyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await reviewService.getReviewsByPharmacy(pharmacyId, {
      page,
      limit,
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

async function createReview(req, res, next) {
  try {
    const { pharmacyId } = req.params;
    const { nota, comentario } = req.body;

    const review = await reviewService.createReview(
      req.user.id,
      req.user.nome,
      { pharmacyId, nota, comentario },
    );

    return res.status(201).json({
      success: true,
      message: "Avaliação enviada com sucesso",
      data: { review },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getReviews,
  createReview,
};
