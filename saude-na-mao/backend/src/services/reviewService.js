const Review = require("../models/Review");
const Pharmacy = require("../models/Pharmacy");
const mongoose = require("mongoose");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getReviewsByPharmacy(pharmacyId, { page = 1, limit = 10 }) {
  if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
    throw createError("Farmácia não encontrada", 404);
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ id_farmacia: pharmacyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ id_farmacia: pharmacyId }),
  ]);

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

async function createReview(userId, userName, { pharmacyId, nota, comentario }) {
  if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
    throw createError("Farmácia não encontrada", 404);
  }

  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    throw createError("Farmácia não encontrada", 404);
  }

  if (nota < 1 || nota > 5) {
    throw createError("Nota deve ser entre 1 e 5", 400);
  }

  const existing = await Review.findOne({
    id_farmacia: pharmacyId,
    id_usuario: userId,
  });

  if (existing) {
    throw createError("Você já avaliou esta farmácia", 409);
  }

  const review = await Review.create({
    id_farmacia: pharmacyId,
    id_usuario: userId,
    nome_usuario: userName,
    nota,
    comentario: comentario || null,
  });

  const stats = await Review.aggregate([
    { $match: { id_farmacia: new mongoose.Types.ObjectId(pharmacyId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$nota" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    pharmacy.avaliacao = Math.round(stats[0].avgRating * 10) / 10;
    pharmacy.total_avaliacoes = stats[0].count;
    await pharmacy.save();
  }

  return review;
}

module.exports = {
  getReviewsByPharmacy,
  createReview,
};
