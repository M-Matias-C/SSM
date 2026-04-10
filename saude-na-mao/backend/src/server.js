require("dotenv").config();

const http = require("http");
const connectDB = require("./config/database");
const { initSocket } = require("./config/socket");
const { setupStockSocket } = require("./sockets/stockSocket");
const { setupCronJobs } = require("./scripts/cronJobs");
const app = require("./app");

const startServer = async () => {
  try {
    await connectDB();
    setupCronJobs();
    console.log("Cron jobs configurados");

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
