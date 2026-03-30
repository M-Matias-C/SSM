const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// CORS config
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
};
app.use(cors(corsOptions));

// Helmet para segurança
app.use(helmet());

// JSON parser
app.use(express.json({ limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Rotas de autenticação
app.use("/api/v1/auth", authRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Rota não encontrada" });
});

// Error handler
app.use(errorHandler);

module.exports = app;
