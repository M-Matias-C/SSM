require("dotenv").config();

const http = require("http");
const connectDB = require("./config/database");
const { initSocket } = require("./config/socket");
const { setupStockSocket } = require("./sockets/stockSocket");
const app = require("./app");

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;
    const server = http.createServer(app);
    const io = initSocket(server);

    setupStockSocket(io);

    server.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log("Socket.io ativo");
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
  }
};

startServer();
