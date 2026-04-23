const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const pharmacistRoutes = require("./routes/pharmacistRoutes");
const productRoutes = require("./routes/productRoutes");
const geoRoutes = require("./routes/geoRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const prescriptionUseRoutes = require("./routes/prescriptionUseRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const faqRoutes = require("./routes/faqRoutes");
const supportRoutes = require("./routes/supportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const couponRoutes = require("./routes/couponRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const drugRoutes = require("./routes/drugRoutes");
const auditRoutes = require("./routes/auditRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const { authenticate, auditLog } = require("./middlewares/auth");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(helmet());

app.use((req, res, next) => {
  if (req.path === "/api/v1/payments/webhook/mercadopago") {
    return next();
  }

  return express.json({ limit: "10mb" })(req, res, next);
});

app.use(cookieParser());

// Middleware de auditoria (log de todas as ações)
app.use(auditLog);

app.use("/uploads", express.static("uploads"));
app.use("/uploads/comprovantes", express.static("uploads/comprovantes"));

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/farmacias", pharmacyRoutes);
app.use("/api/v1/pharmacies", pharmacyRoutes);

app.use("/api/v1/pharmacists", pharmacistRoutes);

app.use("/api/v1/produtos", productRoutes);
app.use("/api/v1/products", productRoutes);

app.use("/api/v1/geo", geoRoutes);

app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/receitas", prescriptionRoutes);

app.use("/api/v1/prescription-uses", prescriptionUseRoutes);
app.use("/api/v1/receitas-uso", prescriptionUseRoutes);

app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/carrinho", cartRoutes);

app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/pagamentos", paymentRoutes);

app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/pedidos", orderRoutes);

app.use("/api/v1/faq", faqRoutes);

app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/suporte", supportRoutes);

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/cupons", couponRoutes);
app.use("/api/v1/coupons", couponRoutes);

app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/avaliacoes", reviewRoutes);

app.use("/api/v1/deliveries", deliveryRoutes);
app.use("/api/v1/entregas", deliveryRoutes);

app.use("/api/v1/drugs", drugRoutes);
app.use("/api/v1/medicamentos", drugRoutes);

app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/auditoria", auditRoutes);

app.use("/api/v1/tracking", trackingRoutes);
app.use("/api/v1/rastreamento", trackingRoutes);

// Rotas de Verificação (RBAC - Proprietário de Farmácia)
app.use("/api/v1/verification", verificationRoutes);
app.use("/api/v1/verificacao", verificationRoutes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Rota não encontrada" });
});

app.use(errorHandler);

module.exports = app;
