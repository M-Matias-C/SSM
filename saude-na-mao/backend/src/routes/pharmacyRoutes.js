const express = require("express");
const { query, param, validationResult } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware");
const pharmacyController = require("../controllers/pharmacyController");

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Rotas públicas
router.get("/", pharmacyController.listPharmacies);

router.get(
  "/nearby",
  [
    query("longitude")
      .notEmpty()
      .withMessage("Longitude é obrigatória")
      .isFloat()
      .withMessage("Longitude deve ser um número válido"),
    query("latitude")
      .notEmpty()
      .withMessage("Latitude é obrigatória")
      .isFloat()
      .withMessage("Latitude deve ser um número válido"),
  ],
  validateRequest,
  pharmacyController.findNearbyPharmacies,
);

router.get("/:id", pharmacyController.getPharmacyById);

router.get("/:id/products", pharmacyController.getPharmacyProducts);

// Rotas privadas (administrador)
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.authorize("administrador"),
  pharmacyController.createPharmacy,
);

router.patch(
  "/:id",
  authMiddleware.protect,
  authMiddleware.authorize("administrador"),
  pharmacyController.updatePharmacy,
);

module.exports = router;
