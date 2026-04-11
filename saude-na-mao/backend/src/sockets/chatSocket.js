function setupChatSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join:support", ({ ticketId, userId } = {}) => {
      if (!ticketId) {
        socket.emit("error", { message: "ticketId é obrigatório" });
        return;
      }

      const room = "support:" + ticketId;
      socket.join(room);
      socket.emit("joined", { room });
      console.log(`Usuário ${userId} entrou no suporte ${ticketId}`);
    });

    socket.on("join:support:admin", ({ userId } = {}) => {
      socket.join("support:admin");
      socket.emit("joined:admin", { room: "support:admin" });
      console.log(`Atendente ${userId} entrou no painel de suporte`);
    });

    socket.on("support:typing", ({ ticketId, userId, isTyping } = {}) => {
      if (!ticketId) {
        socket.emit("error", { message: "ticketId é obrigatório" });
        return;
      }

      socket.to("support:" + ticketId).emit("support:typing", {
        userId,
        isTyping,
      });
    });

    socket.on("support:read", ({ ticketId, userId } = {}) => {
      if (!ticketId) {
        socket.emit("error", { message: "ticketId é obrigatório" });
        return;
      }

      io.to("support:" + ticketId).emit("support:messages_read", { userId });
    });

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado do suporte: ${socket.id}`);
    });
  });
}

module.exports = { setupChatSocket };
