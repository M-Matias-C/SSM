require("dotenv").config();

const connectDB = require("./config/database");
const app = require("./app");

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📡 API disponível em http://localhost:${PORT}/api/v1/auth`);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
  }
};

startServer();
