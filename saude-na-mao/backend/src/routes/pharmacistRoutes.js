const express = require("express");
const { body, param, validationResult } = require("express-validator");
const pharmacistController = require("../controllers/pharmacistController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

router.get("/available", pharmacistController.listAvailable);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("ID inválido")],
  validateRequest,
  pharmacistController.getById
);

router.get(
  "/pharmacy/:id_farmacia",
  [param("id_farmacia").isMongoId().withMessage("ID da farmácia inválido")],
  validateRequest,
  pharmacistController.getByPharmacy
);

router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.authorize("administrador"),
  [
    body("nome").notEmpty().withMessage("Nome é obrigatório"),
    body("email").isEmail().withMessage("E-mail inválido"),
    body("crm").notEmpty().withMessage("CRM é obrigatório"),
    body("id_farmacia").isMongoId().withMessage("ID da farmácia inválido"),
  ],
  validateRequest,
  pharmacistController.create
);

router.put(
  "/:id",
  authMiddleware.protect,
  [param("id").isMongoId().withMessage("ID inválido")],
  validateRequest,
  pharmacistController.update
);

router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.authorize("administrador"),
  [param("id").isMongoId().withMessage("ID inválido")],
  validateRequest,
  pharmacistController.delete
);

router.put(
  "/:id/rating",
  [
    param("id").isMongoId().withMessage("ID inválido"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating deve estar entre 1 e 5"),
  ],
  validateRequest,
  pharmacistController.updateRating
);

module.exports = router;
