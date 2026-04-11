const SupportMessage = require("../models/SupportMessage");
const User = require("../models/User");
const { getIO } = require("../config/socket");
const { sendPushNotification } = require("./notificationService");

const STAFF_ROLES = ["farmaceutico", "admin", "farmacia", "administrador"];

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizePagination(page, limit, defaultLimit = 10) {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  return {
    page: Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit:
      Number.isNaN(parsedLimit) || parsedLimit < 1 ? defaultLimit : parsedLimit,
  };
}

function isEndUser(tipoUsuario) {
  return tipoUsuario === "usuario" || tipoUsuario === "cliente";
}

function ensureValidTicketId(ticketId) {
  if (!ticketId || !SupportMessage.db.base.Types.ObjectId.isValid(ticketId)) {
    throw createError("Ticket não encontrado", 404);
  }
}

function getSafeIO() {
  try {
    return getIO();
  } catch (error) {
    return null;
  }
}

function markMessagesAsRead(ticket, tipoUsuario) {
  const markUserMessages = STAFF_ROLES.includes(tipoUsuario);
  const markStaffMessages = isEndUser(tipoUsuario);
  let changed = false;

  for (const mensagem of ticket.mensagens) {
    if (mensagem.lida) {
      continue;
    }

    if (markUserMessages && mensagem.tipo_remetente === "usuario") {
      mensagem.lida = true;
      changed = true;
    }

    if (markStaffMessages && mensagem.tipo_remetente !== "usuario") {
      mensagem.lida = true;
      changed = true;
    }
  }

  return changed;
}

async function findTicketOrThrow(ticketId) {
  ensureValidTicketId(ticketId);

  const ticket = await SupportMessage.findById(ticketId);

  if (!ticket) {
    throw createError("Ticket não encontrado", 404);
  }

  return ticket;
}

async function createTicket(
  userId,
  { assunto, categoria, mensagemInicial, prioridade },
) {
  const ticket = new SupportMessage({
    id_usuario: userId,
    assunto,
    categoria,
    prioridade,
    status: "aberta",
  });

  ticket.adicionarMensagem({
    remetenteId: userId,
    tipoRemetente: "usuario",
    texto: mensagemInicial,
  });

  ticket.mensagens.push({
    id_remetente: userId,
    tipo_remetente: "sistema",
    texto: `Ticket #${ticket._id} criado. Um farmacêutico responderá em breve.`,
  });

  await ticket.save();

  const io = getSafeIO();
  if (io) {
    io.to("support:admin").emit("support:new_ticket", {
      ticketId: ticket._id.toString(),
      assunto: ticket.assunto,
      categoria: ticket.categoria,
    });
  }

  return ticket;
}

async function getUserTickets(userId, { page = 1, limit = 10, status } = {}) {
  const pagination = normalizePagination(page, limit, 10);
  const filtro = { id_usuario: userId };

  if (status) {
    filtro.status = status;
  }

  const total = await SupportMessage.countDocuments(filtro);
  const tickets = await SupportMessage.find(filtro)
    .sort({ updatedAt: -1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit);

  return {
    tickets,
    total,
    pagina: pagination.page,
    totalPaginas: Math.ceil(total / pagination.limit) || 1,
  };
}

async function getTicketById(ticketId, userId, tipoUsuario) {
  ensureValidTicketId(ticketId);

  const ticket = await SupportMessage.findById(ticketId)
    .populate({ path: "id_usuario", select: "nome email telefone" })
    .populate({ path: "id_atendente", select: "nome" });

  if (!ticket) {
    throw createError("Ticket não encontrado", 404);
  }

  if (
    isEndUser(tipoUsuario) &&
    String(ticket.id_usuario?._id || "") !== String(userId)
  ) {
    throw createError("Ticket não encontrado", 404);
  }

  if (markMessagesAsRead(ticket, tipoUsuario)) {
    await ticket.save();
  }

  return ticket;
}

async function sendMessage(ticketId, { remetenteId, tipoRemetente, texto }) {
  const ticket = await findTicketOrThrow(ticketId);

  if (ticket.status === "encerrada") {
    throw createError("Ticket encerrado. Abra um novo para continuar.", 400);
  }

  ticket.adicionarMensagem({ remetenteId, tipoRemetente, texto });

  if (tipoRemetente !== "usuario") {
    if (ticket.status === "aberta") {
      ticket.status = "em_atendimento";
      ticket.id_atendente = remetenteId;
    } else {
      ticket.status = "respondida";
      ticket.id_atendente = ticket.id_atendente || remetenteId;
    }
  }

  if (tipoRemetente === "usuario" && ticket.status === "respondida") {
    ticket.status = "em_atendimento";
  }

  await ticket.save();

  const enviadoEm = new Date();
  const io = getSafeIO();
  if (io) {
    io.to("support:" + ticketId).emit("support:message", {
      ticketId,
      mensagem: {
        remetenteId,
        tipoRemetente,
        texto,
        enviado_em: enviadoEm,
      },
    });
  }

  if (tipoRemetente !== "usuario") {
    const usuario = await User.findById(ticket.id_usuario).select(
      "nome +fcmToken",
    );

    if (usuario?.fcmToken) {
      await sendPushNotification({
        token: usuario.fcmToken,
        userId: usuario._id,
        title: "Nova resposta no seu suporte",
        body: "O farmacêutico respondeu seu ticket: " + ticket.assunto,
        data: {
          tipo: "support_message",
          ticketId: ticket._id.toString(),
        },
      });
    }
  }

  return ticket;
}

async function closeTicket(ticketId, usuarioId, tipoUsuario) {
  const ticket = await findTicketOrThrow(ticketId);

  if (
    isEndUser(tipoUsuario) &&
    String(ticket.id_usuario) !== String(usuarioId)
  ) {
    throw createError("Ticket não encontrado", 404);
  }

  if (ticket.status === "encerrada") {
    throw createError("Ticket já encerrado", 400);
  }

  ticket.status = "encerrada";
  ticket.encerrada_em = new Date();
  ticket.mensagens.push({
    id_remetente: usuarioId,
    tipo_remetente: "sistema",
    texto: "Ticket encerrado.",
  });

  await ticket.save();

  return ticket;
}

async function rateSupport(ticketId, userId, { nota, comentario }) {
  const ticket = await findTicketOrThrow(ticketId);

  if (String(ticket.id_usuario) !== String(userId)) {
    throw createError("Ticket não encontrado", 404);
  }

  if (ticket.status !== "encerrada") {
    throw createError("Avalie apenas após o encerramento do ticket", 400);
  }

  if (ticket.avaliado_em) {
    throw createError("Ticket já avaliado", 400);
  }

  ticket.avaliacao_atendimento = nota;
  ticket.comentario_avaliacao = comentario;
  ticket.avaliado_em = new Date();

  await ticket.save();

  return ticket;
}

async function getAllTickets({
  page = 1,
  limit = 20,
  status,
  categoria,
  prioridade,
} = {}) {
  const pagination = normalizePagination(page, limit, 20);
  const filtro = {};

  if (status) {
    filtro.status = status;
  }

  if (categoria) {
    filtro.categoria = categoria;
  }

  if (prioridade) {
    filtro.prioridade = prioridade;
  }

  const total = await SupportMessage.countDocuments(filtro);
  const tickets = await SupportMessage.aggregate([
    { $match: filtro },
    {
      $addFields: {
        prioridade_ordem: {
          $switch: {
            branches: [
              { case: { $eq: ["$prioridade", "urgente"] }, then: 0 },
              { case: { $eq: ["$prioridade", "alta"] }, then: 1 },
              { case: { $eq: ["$prioridade", "normal"] }, then: 2 },
              { case: { $eq: ["$prioridade", "baixa"] }, then: 3 },
            ],
            default: 4,
          },
        },
      },
    },
    { $sort: { prioridade_ordem: 1, updatedAt: -1 } },
    { $skip: (pagination.page - 1) * pagination.limit },
    { $limit: pagination.limit },
    {
      $lookup: {
        from: "users",
        localField: "id_usuario",
        foreignField: "_id",
        as: "id_usuario",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "id_atendente",
        foreignField: "_id",
        as: "id_atendente",
      },
    },
    {
      $unwind: {
        path: "$id_usuario",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$id_atendente",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        prioridade_ordem: 0,
        "id_usuario.nome": 1,
        "id_usuario.telefone": 1,
        "id_atendente.nome": 1,
        assunto: 1,
        categoria: 1,
        status: 1,
        prioridade: 1,
        mensagens: 1,
        avaliacao_atendimento: 1,
        comentario_avaliacao: 1,
        avaliado_em: 1,
        aberta_em: 1,
        encerrada_em: 1,
        primeira_resposta_em: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return {
    tickets,
    total,
    pagina: pagination.page,
    totalPaginas: Math.ceil(total / pagination.limit) || 1,
  };
}

async function assignTicket(ticketId, atendenteId) {
  const ticket = await findTicketOrThrow(ticketId);
  const atendente = await User.findById(atendenteId).select("nome");

  if (!atendente) {
    throw createError("Atendente não encontrado", 404);
  }

  ticket.id_atendente = atendenteId;
  if (ticket.status === "aberta") {
    ticket.status = "em_atendimento";
  }

  await ticket.save();

  return ticket;
}

async function getUnreadCount(userId, tipoUsuario) {
  if (isEndUser(tipoUsuario)) {
    const resultado = await SupportMessage.aggregate([
      { $match: { id_usuario: userId } },
      { $unwind: "$mensagens" },
      {
        $match: {
          "mensagens.lida": false,
          "mensagens.tipo_remetente": { $ne: "usuario" },
        },
      },
      { $count: "nao_lidas" },
    ]);

    return { nao_lidas: resultado[0]?.nao_lidas || 0 };
  }

  const naoLidas = await SupportMessage.countDocuments({
    status: "aberta",
    id_atendente: null,
  });

  return { nao_lidas: naoLidas };
}

module.exports = {
  createTicket,
  getUserTickets,
  getTicketById,
  sendMessage,
  closeTicket,
  rateSupport,
  getAllTickets,
  assignTicket,
  getUnreadCount,
};
