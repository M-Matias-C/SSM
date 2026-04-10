const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const productRoutes = require("./routes/productRoutes");
const geoRoutes = require("./routes/geoRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
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

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static("uploads"));

// Rotas de autenticação
app.use("/api/v1/auth", authRoutes);

// Rotas de usuário
app.use("/api/v1/users", userRoutes);

// Rotas de farmácias
app.use("/api/v1/farmacias", pharmacyRoutes);
app.use("/api/v1/pharmacies", pharmacyRoutes);

// Rotas de produtos
app.use("/api/v1/produtos", productRoutes);
app.use("/api/v1/products", productRoutes);

// Rotas de geolocalização
app.use("/api/v1/geo", geoRoutes);

// Rotas de receitas médicas
app.use("/api/v1/prescriptions", prescriptionRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Rota não encontrada" });
});

// Error handler
app.use(errorHandler);

module.exports = app;
