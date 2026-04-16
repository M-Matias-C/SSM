const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendOrderStatusNotification } = require("./notificationService");
const { getIO } = require("../config/socket");
const crypto = require("crypto");

const ALLOWED_STATUS_TRANSITIONS = {
  aguardando_pagamento: ["cancelado"],
  em_processamento: ["a_caminho", "cancelado"],
  a_caminho: ["entregue"],
};

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

function normalizeObjectId(value) {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return value;
}

function formatStatusForNotification(status) {
  const labels = {
    aguardando_pagamento: "Aguardando pagamento",
    em_processamento: "Em processamento",
    a_caminho: "A caminho",
    entregue: "Entregue",
    cancelado: "Cancelado",
    rejeitado: "Rejeitado",
  };

  return labels[status] || status;
}

function canTransitionStatus(statusAtual, novoStatus) {
  return ALLOWED_STATUS_TRANSITIONS[statusAtual]?.includes(novoStatus) || false;
}

function ensureOwnership(order, fieldName, expectedId) {
  if (!expectedId) {
    return;
  }

  if (String(order[fieldName]) !== String(expectedId)) {
    throw createError("Pedido não encontrado", 404);
  }
}

async function findOrderOrThrow(filter, populate = null) {
  try {
    let query = Order.findOne(filter);

    if (populate) {
      query = query.populate(populate);
    }

    const order = await query;

    if (!order) {
      throw createError("Pedido não encontrado", 404);
    }

    return order;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    if (error.name === "CastError") {
      throw createError("Pedido não encontrado", 404);
    }

    throw error;
  }
}

async function emitOrderStatus(orderId, novoStatus, observacao) {
  const io = getIO();
  io.to("order:" + orderId).emit("order:status", {
    orderId,
    novoStatus,
    atualizadoEm: new Date(),
    observacao,
  });
}

async function notifyOrderStatus(order, novoStatus) {
  const notificacoesEnviadas = order.notificacoes_enviadas || [];

  if (notificacoesEnviadas.includes(novoStatus)) {
    return order;
  }

  const usuario = await User.findById(order.id_usuario).select(
    "nome telefone +fcmToken",
  );

  if (usuario) {
    await sendOrderStatusNotification(
      usuario,
      order,
      formatStatusForNotification(novoStatus),
    );
  }

  order.notificacoes_enviadas.push(novoStatus);
  await order.save();

  return order;
}

async function createOrder(userId, orderData) {
  const {
    itens,
    id_farmacia,
    tipo_entrega,
    endereco_entrega,
    subtotal,
    taxa_entrega,
    total,
    cupom,
    metodo_pagamento,
  } = orderData;

  if (!itens || itens.length === 0) {
    throw createError("Pedido deve conter ao menos um item", 400);
  }

  if (!id_farmacia) {
    throw createError("Farmácia é obrigatória", 400);
  }

  if (!tipo_entrega) {
    throw createError("Tipo de entrega é obrigatório", 400);
  }

  const order = new Order({
    id_usuario: userId,
    id_farmacia,
    itens,
    tipo_entrega,
    endereco_entrega: endereco_entrega || {},
    subtotal,
    taxa_entrega: taxa_entrega || 0,
    total,
    cupom: cupom || {},
    metodo_pagamento: metodo_pagamento || "pix",
    status: "em_processamento",
    status_pagamento: "aprovado",
    historico_status: [
      { status: "em_processamento", observacao: "Pedido criado" },
    ],
  });

  await order.save();

  for (const item of itens) {
    if (item.id_produto) {
      await Product.findByIdAndUpdate(item.id_produto, {
        $inc: { estoque: -item.quantidade },
      });
    }
  }

  return order;
}

async function getOrderById(orderId, userId) {
  const order = await findOrderOrThrow(
    { _id: orderId },
    {
      path: "id_farmacia",
      select: "nome telefone endereco cidade estado",
    },
  );

  ensureOwnership(order, "id_usuario", userId);

  return order;
}

async function getUserOrders(userId, { page = 1, limit = 10, status } = {}) {
  const pagination = normalizePagination(page, limit, 10);
  const filtro = { id_usuario: userId };

  if (status) {
    filtro.status = status;
  }

  const total = await Order.countDocuments(filtro);
  const pedidos = await Order.find(filtro)
    .sort({ createdAt: -1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .populate({ path: "id_farmacia", select: "nome cidade" });

  return {
    pedidos,
    total,
    pagina: pagination.page,
    totalPaginas: Math.ceil(total / pagination.limit) || 1,
  };
}

async function getPharmacyOrders(
  pharmacyId,
  { page = 1, limit = 20, status } = {},
) {
  const pagination = normalizePagination(page, limit, 20);
  const filtro = { id_farmacia: pharmacyId };

  if (status) {
    filtro.status = status;
  }

  const total = await Order.countDocuments(filtro);
  const pedidos = await Order.find(filtro)
    .sort({ createdAt: -1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .populate({ path: "id_usuario", select: "nome telefone" });

  return {
    pedidos,
    total,
    pagina: pagination.page,
    totalPaginas: Math.ceil(total / pagination.limit) || 1,
  };
}

async function updateOrderStatus(
  orderId,
  novoStatus,
  { usuarioId, pharmacyId, observacao, entregador } = {},
) {
  const order = await findOrderOrThrow({ _id: orderId });

  if (!canTransitionStatus(order.status, novoStatus)) {
    throw createError(
      `Transição inválida de status: ${order.status} -> ${novoStatus}`,
      400,
    );
  }

  if (usuarioId) {
    ensureOwnership(order, "id_usuario", usuarioId);
  }

  if (pharmacyId) {
    ensureOwnership(order, "id_farmacia", pharmacyId);
  }

  order.adicionarHistoricoStatus(novoStatus, observacao);

  if (novoStatus === "a_caminho" && entregador) {
    const entregadorAtual =
      order.entregador?.toObject?.() || order.entregador || {};
    const localizacaoAtual =
      entregador.localizacao_atual || entregadorAtual.localizacao_atual || {};

    order.entregador = {
      ...entregadorAtual,
      ...entregador,
      localizacao_atual: localizacaoAtual,
    };
  }

  if (novoStatus === "entregue") {
    order.avaliacao_entrega = null;
  }

  if (novoStatus === "cancelado") {
    order.cancelado_em = new Date();

    if (order.tipo_entrega !== "retirada") {
      for (const item of order.itens) {
        if (!item.id_produto || !item.quantidade) {
          continue;
        }

        await Product.findByIdAndUpdate(item.id_produto, {
          $inc: { estoque: item.quantidade },
        });
      }
    }
  }

  await order.save();
  await emitOrderStatus(orderId, novoStatus, observacao);
  await notifyOrderStatus(order, novoStatus);

  return order;
}

async function cancelOrder(orderId, userId) {
  const order = await findOrderOrThrow({ _id: orderId, id_usuario: userId });

  if (order.status === "a_caminho" || order.status === "entregue") {
    throw createError(
      "Pedido não pode ser cancelado após saída para entrega",
      400,
    );
  }

  if (order.status === "cancelado") {
    throw createError("Pedido já cancelado", 400);
  }

  return updateOrderStatus(orderId, "cancelado", {
    usuarioId: userId,
    observacao: "Cancelado pelo usuário",
  });
}

async function rejectOrder(orderId, pharmacyId, motivo) {
  const order = await findOrderOrThrow({
    _id: orderId,
    id_farmacia: pharmacyId,
  });

  if (order.status !== "em_processamento") {
    throw createError("Pedido não pode ser rejeitado neste status", 400);
  }

  order.motivo_cancelamento = motivo;
  await order.save();

  return updateOrderStatus(orderId, "cancelado", {
    observacao: motivo,
  });
}

async function updateDeliveryLocation(
  orderId,
  { latitude, longitude, pharmacyId } = {},
) {
  const order = await findOrderOrThrow({ _id: orderId });

  if (pharmacyId) {
    ensureOwnership(order, "id_farmacia", pharmacyId);
  }

  if (order.status !== "a_caminho") {
    throw createError("Pedido não está em rota de entrega", 400);
  }

  const latitudeNumerica = Number(latitude);
  const longitudeNumerica = Number(longitude);

  if (
    !Number.isFinite(latitudeNumerica) ||
    !Number.isFinite(longitudeNumerica)
  ) {
    throw createError("Latitude e longitude devem ser números válidos", 400);
  }

  const atualizadoEm = new Date();
  const entregadorAtual =
    order.entregador?.toObject?.() || order.entregador || {};

  order.entregador = {
    ...entregadorAtual,
    localizacao_atual: {
      latitude: latitudeNumerica,
      longitude: longitudeNumerica,
      atualizado_em: atualizadoEm,
    },
  };

  await order.save();

  const io = getIO();
  io.to("order:" + orderId).emit("delivery:location", {
    orderId,
    latitude: latitudeNumerica,
    longitude: longitudeNumerica,
    atualizadoEm: atualizadoEm,
  });

  return { success: true };
}

async function rateDelivery(orderId, userId, { nota, comentario } = {}) {
  const order = await findOrderOrThrow({ _id: orderId, id_usuario: userId });

  if (order.status !== "entregue") {
    throw createError("Só é possível avaliar pedidos entregues", 400);
  }

  if (order.avaliado_em) {
    throw createError("Pedido já avaliado", 400);
  }

  const notaNumerica = Number(nota);

  if (!Number.isFinite(notaNumerica) || notaNumerica < 1 || notaNumerica > 5) {
    throw createError("Nota deve ser um número inteiro entre 1 e 5", 400);
  }

  order.avaliacao_entrega = notaNumerica;
  order.comentario_avaliacao = comentario;
  order.avaliado_em = new Date();

  await order.save();

  return order;
}

async function generatePickupCode(orderId, pharmacyId) {
  const order = await findOrderOrThrow({ _id: orderId });

  if (pharmacyId) {
    ensureOwnership(order, "id_farmacia", pharmacyId);
  }

  if (!["retirada", "drive-thru"].includes(order.tipo_entrega)) {
    throw createError(
      "Código de retirada disponível apenas para pedidos de retirada ou drive-thru",
      400,
    );
  }

  const codigo = crypto.randomInt(100000, 999999).toString();
  order.codigo_retirada = codigo;
  await order.save();

  return codigo;
}

async function getOrderStats(pharmacyId) {
  const pharmacyObjectId = normalizeObjectId(pharmacyId);

  const porStatusAggregation = await Order.aggregate([
    { $match: { id_farmacia: pharmacyObjectId } },
    { $group: { _id: "$status", total: { $sum: 1 } } },
  ]);

  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const totalHoje = await Order.countDocuments({
    id_farmacia: pharmacyObjectId,
    createdAt: { $gte: inicioDoDia },
  });

  const por_status = porStatusAggregation.reduce((accumulator, item) => {
    accumulator[item._id] = item.total;
    return accumulator;
  }, {});

  return {
    por_status,
    total_hoje: totalHoje,
  };
}

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  getPharmacyOrders,
  updateOrderStatus,
  cancelOrder,
  rejectOrder,
  updateDeliveryLocation,
  rateDelivery,
  generatePickupCode,
  getOrderStats,
};
