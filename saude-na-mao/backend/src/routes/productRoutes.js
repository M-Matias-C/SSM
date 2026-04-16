const express = require("express");
const { param, validationResult } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware");
const productController = require("../controllers/productController");

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.get("/", productController.searchProducts);

router.get("/categorias", productController.getCategories);

router.get("/destaque", productController.getFeaturedProducts);

router.get("/categoria/:categoria", productController.getProductsByCategory);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("ID de produto inválido")],
  validateRequest,
  productController.getProductById,
);

router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.authorize("administrador", "farmacia"),
  productController.createProduct,
);

router.patch(
  "/:id",
  authMiddleware.protect,
  authMiddleware.authorize("administrador", "farmacia"),
  [param("id").isMongoId().withMessage("ID de produto inválido")],
  validateRequest,
  productController.updateProduct,
);

module.exports = router;
