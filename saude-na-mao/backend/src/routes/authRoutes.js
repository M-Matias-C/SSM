const express = require("express");
const { body, param, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Rate limiter: 10 reqs por 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Muitas tentativas, tente novamente mais tarde.",
  },
});

// Middleware para validação de request
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// Express-validator custom password
const passwordValidator = body("senha")
  .isLength({ min: 8 })
  .withMessage("A senha deve ter pelo menos 8 caracteres")
  .matches(/[A-Z]/)
  .withMessage("A senha deve conter uma letra maiúscula")
  .matches(/[a-z]/)
  .withMessage("A senha deve conter uma letra minúscula")
  .matches(/[0-9]/)
  .withMessage("A senha deve conter um número")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("A senha deve conter um caractere especial");

const newPasswordValidator = body("novaSenha")
  .isLength({ min: 8 })
  .withMessage("A senha deve ter pelo menos 8 caracteres")
  .matches(/[A-Z]/)
  .withMessage("A senha deve conter uma letra maiúscula")
  .matches(/[a-z]/)
  .withMessage("A senha deve conter uma letra minúscula")
  .matches(/[0-9]/)
  .withMessage("A senha deve conter um número")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("A senha deve conter um caractere especial");

// POST /register
router.post(
  "/register",
  authLimiter,
  [
    body("nome").notEmpty().withMessage("Nome é obrigatório"),
    body("email").isEmail().withMessage("E-mail inválido").normalizeEmail(),
    passwordValidator,
    body("cpf")
      .optional()
      .isLength({ min: 11, max: 11 })
      .withMessage("CPF deve ter 11 dígitos")
      .isNumeric()
      .withMessage("CPF deve conter apenas números"),
  ],
  validateRequest,
  authController.register,
);

// POST /login
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("E-mail inválido").normalizeEmail(),
    body("senha").notEmpty().withMessage("Senha é obrigatória"),
  ],
  validateRequest,
  authController.login,
);

// POST /refresh-token
router.post("/refresh-token", authController.refreshToken);

// POST /logout
router.post("/logout", authController.logout);

// POST /forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("E-mail inválido").normalizeEmail()],
  validateRequest,
  authController.forgotPassword,
);

// POST /reset-password/:token
router.post(
  "/reset-password/:token",
  [newPasswordValidator],
  validateRequest,
  authController.resetPassword,
);

module.exports = router;
