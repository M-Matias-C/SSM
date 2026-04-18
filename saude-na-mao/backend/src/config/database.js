const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    if (retries > 0) {
      console.log(`Tentando reconectar em ${RETRY_DELAY_MS / 1000}s... (${retries} tentativas restantes)`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB desconectado");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB erro de conexão:", err.message);
});

module.exports = connectDB;
