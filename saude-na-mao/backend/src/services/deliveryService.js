const mongoose = require("mongoose");
const Delivery = require("../models/Delivery");
const Order = require("../models/Order");
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const crypto = require("crypto");
const { getIO } = require("../config/socket");

const ALLOWED_STATUS_TRANSITIONS = {
  disponivel: ["aceita", "cancelada"],
  aceita: ["coletando", "cancelada"],
  coletando: ["coletada", "cancelada"],
  coletada: ["em_transito", "cancelada"],
  em_transito: ["entregue", "cancelada"],
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
    limit: Number.isNaN(parsedLimit) || parsedLimit < 1 ? defaultLimit : parsedLimit,
  };
}

function canTransition(atual, novo) {
  return ALLOWED_STATUS_TRANSITIONS[atual]?.includes(novo) || false;
}

async function findDeliveryOrThrow(filter, populate = null) {
  let query = Delivery.findOne(filter);
  if (populate) query = query.populate(populate);
  const delivery = await query;
  if (!delivery) throw createError("Entrega não encontrada", 404);
  return delivery;
}

function emitDeliveryUpdate(deliveryId, event, data) {
  try {
    const io = getIO();
    io.to("delivery:" + deliveryId).emit(event, { deliveryId, ...data });
  } catch (_) {
    // Socket não inicializado em testes
  }
}

/**
 * Cria uma entrega para um pedido.
 * Chamado pela farmácia quando o pedido está pronto para despacho.
 */
async function createDelivery(orderIdStr, pharmacyId) {
  const order = await Order.findById(orderIdStr);
  if (!order) throw createError("Pedido não encontrado", 404);

  if (String(order.id_farmacia) !== String(pharmacyId)) {
    throw createError("Pedido não pertence a esta farmácia", 403);
  }

  if (order.status !== "em_processamento") {
    throw createError("Pedido precisa estar em processamento para criar entrega", 400);
  }

  if (["retirada", "drive-thru"].includes(order.tipo_entrega)) {
    throw createError("Pedidos de retirada/drive-thru não precisam de entrega", 400);
  }

  const existing = await Delivery.findOne({ id_pedido: order._id, status: { $ne: "cancelada" } });
  if (existing) throw createError("Já existe uma entrega ativa para este pedido", 400);

  const pharmacy = await Pharmacy.findById(pharmacyId).select("nome endereco cidade estado cep location");
  if (!pharmacy) throw createError("Farmácia não encontrada", 404);

  const codigoConfirmacao = crypto.randomInt(100000, 999999).toString();

  const endereco_coleta = {
    logradouro: pharmacy.endereco || "",
    cidade: pharmacy.cidade || "",
    estado: pharmacy.estado || "",
    cep: pharmacy.cep || "",
  };
  if (pharmacy.location?.coordinates?.length === 2) {
    endereco_coleta.location = {
      type: "Point",
      coordinates: pharmacy.location.coordinates,
    };
  }

  const endereco_entrega = {
    logradouro: order.endereco_entrega?.logradouro || "",
    numero: order.endereco_entrega?.numero || "",
    complemento: order.endereco_entrega?.complemento || "",
    bairro: order.endereco_entrega?.bairro || "",
    cidade: order.endereco_entrega?.cidade || "",
    estado: order.endereco_entrega?.estado || "",
    cep: order.endereco_entrega?.cep || "",
  };

  const delivery = new Delivery({
    id_pedido: order._id,
    id_farmacia: pharmacyId,
    id_cliente: order.id_usuario,
    status: "disponivel",
    endereco_coleta,
    endereco_entrega,
    valor_entrega: order.taxa_entrega || 0,
    codigo_confirmacao: codigoConfirmacao,
    historico_status: [{ status: "disponivel", observacao: "Entrega criada e disponível para entregadores" }],
  });

  await delivery.save();

  order.id_entrega = delivery._id;
  await order.save();

  return delivery;
}

/**
 * Lista entregas disponíveis para entregadores (com filtro por proximidade opcional).
 */
async function getAvailableDeliveries({ latitude, longitude, raioKm = 10, page = 1, limit = 20 } = {}) {
  const pagination = normalizePagination(page, limit, 20);
  const filter = { status: "disponivel", id_entregador: null };

  if (latitude && longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      filter["endereco_coleta.location"] = {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: raioKm * 1000,
        },
      };
    }
  }

  const total = await Delivery.countDocuments(
    filter["endereco_coleta.location"] ? { status: "disponivel", id_entregador: null } : filter,
  );

  const entregas = await Delivery.find(filter)
    .sort({ createdAt: -1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .populate({ path: "id_farmacia", select: "nome cidade estado" })
    .populate({ path: "id_pedido", select: "tipo_entrega total itens" });

  return {
    entregas,
    total,
    pagina: pagination.page,
    totalPaginas: Math.ceil(total / pagination.limit) || 1,
  };
}

/**
 * Lista entregas do entregador autenticado.
 */
async function getMyDeliveries(entregadorId, { page = 1, limit = 20, status } = {}) {
  const pagination = normalizePagination(page, limit, 20);
  const filter = { id_entregador: entregadorId };
  if (status) filter.status = status;

  const total = await Delivery.countDocuments(filter);
  const entregas = await Delivery.find(filter)
    .sort({ createdAt: -1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .populate({ path: "id_farmacia", select: "nome cidade estado" })
    .populate({ path: "id_cliente", select: "nome telefone" });

  return {
    entregas,
    total,
    pagina: pagination.page,
    totalPaginas: Math.ceil(total / pagination.limit) || 1,
  };
}

/**
 * Detalhes de uma entrega.
 */
async function getDeliveryById(deliveryId, userId, userRole) {
  const delivery = await findDeliveryOrThrow(
    { _id: deliveryId },
    [
      { path: "id_farmacia", select: "nome endereco cidade estado telefone" },
      { path: "id_cliente", select: "nome telefone" },
      { path: "id_entregador", select: "nome telefone dados_entregador.tipo_veiculo" },
      { path: "id_pedido", select: "itens total tipo_entrega status" },
    ],
  );

  // Verificar acesso
  if (userRole === "cliente" && String(delivery.id_cliente?._id || delivery.id_cliente) !== String(userId)) {
    throw createError("Entrega não encontrada", 404);
  }
  if (userRole === "entregador" && delivery.id_entregador && String(delivery.id_entregador?._id || delivery.id_entregador) !== String(userId)) {
    // Entregador pode ver entregas disponíveis (sem entregador) ou as próprias
    if (delivery.status !== "disponivel") {
      throw createError("Entrega não encontrada", 404);
    }
  }

  return delivery;
}

/**
 * Entregador aceita uma entrega disponível.
 */
async function acceptDelivery(deliveryId, entregadorId) {
  const delivery = await findDeliveryOrThrow({ _id: deliveryId });

  if (delivery.status !== "disponivel") {
    throw createError("Esta entrega não está mais disponível", 400);
  }
  if (delivery.id_entregador) {
    throw createError("Esta entrega já foi aceita por outro entregador", 400);
  }

  // Verificar se entregador não tem outra entrega ativa
  const entregaAtiva = await Delivery.findOne({
    id_entregador: entregadorId,
    status: { $in: ["aceita", "coletando", "coletada", "em_transito"] },
  });
  if (entregaAtiva) {
    throw createError("Você já possui uma entrega ativa. Finalize-a antes de aceitar outra.", 400);
  }

  delivery.id_entregador = entregadorId;
  delivery.aceita_em = new Date();
  delivery.adicionarHistorico("aceita", "Entrega aceita pelo entregador");

  await delivery.save();

  // Atualizar status do pedido para a_caminho
  const entregador = await User.findById(entregadorId).select("nome telefone dados_entregador");
  const order = await Order.findById(delivery.id_pedido);
  if (order) {
    order.adicionarHistoricoStatus("a_caminho", "Entregador a caminho da farmácia");
    order.entregador = {
      nome: entregador?.nome || "",
      telefone: entregador?.telefone || "",
      veiculo: entregador?.dados_entregador?.tipo_veiculo || "",
    };
    await order.save();
  }

  emitDeliveryUpdate(deliveryId, "delivery:accepted", {
    entregadorId,
    status: "aceita",
  });

  return delivery;
}

/**
 * Atualiza status da entrega (entregador).
 */
async function updateDeliveryStatus(deliveryId, novoStatus, { entregadorId, observacao, latitude, longitude } = {}) {
  const delivery = await findDeliveryOrThrow({ _id: deliveryId });

  if (entregadorId && String(delivery.id_entregador) !== String(entregadorId)) {
    throw createError("Você não é o entregador desta entrega", 403);
  }

  if (!canTransition(delivery.status, novoStatus)) {
    throw createError(`Transição inválida: ${delivery.status} → ${novoStatus}`, 400);
  }

  const localizacao = latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude) } : undefined;
  delivery.adicionarHistorico(novoStatus, observacao, localizacao);

  if (novoStatus === "coletada") {
    delivery.coletada_em = new Date();
  }
  if (novoStatus === "entregue") {
    delivery.entregue_em = new Date();
    // Atualizar pedido
    const order = await Order.findById(delivery.id_pedido);
    if (order && order.status !== "entregue") {
      order.adicionarHistoricoStatus("entregue", "Pedido entregue ao cliente");
      await order.save();
    }
    // Incrementar entregas do entregador
    await User.findByIdAndUpdate(delivery.id_entregador, {
      $inc: { "dados_entregador.entregas_realizadas": 1 },
    });
  }
  if (novoStatus === "cancelada") {
    delivery.cancelada_em = new Date();
    delivery.motivo_cancelamento = observacao || "Cancelada";
    // Voltar pedido para em_processamento se necessário
    const order = await Order.findById(delivery.id_pedido);
    if (order && order.status === "a_caminho") {
      order.adicionarHistoricoStatus("em_processamento", "Entrega cancelada - pedido retornado para processamento");
      order.entregador = {};
      order.id_entrega = null;
      await order.save();
    }
  }

  await delivery.save();

  emitDeliveryUpdate(deliveryId, "delivery:status", {
    status: novoStatus,
    atualizadoEm: new Date(),
    observacao,
  });

  return delivery;
}

/**
 * Atualiza localização do entregador durante a entrega.
 */
async function updateLocation(deliveryId, entregadorId, { latitude, longitude }) {
  const delivery = await findDeliveryOrThrow({ _id: deliveryId });

  if (String(delivery.id_entregador) !== String(entregadorId)) {
    throw createError("Você não é o entregador desta entrega", 403);
  }

  if (!["aceita", "coletando", "coletada", "em_transito"].includes(delivery.status)) {
    throw createError("Entrega não está em andamento", 400);
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw createError("Latitude e longitude devem ser números válidos", 400);
  }

  // Atualizar localização no User também
  await User.findByIdAndUpdate(entregadorId, {
    "dados_entregador.localizacao_atual": {
      type: "Point",
      coordinates: [lng, lat],
    },
  });

  // Emitir via socket para tracking em tempo real
  emitDeliveryUpdate(deliveryId, "delivery:location", {
    latitude: lat,
    longitude: lng,
    atualizadoEm: new Date(),
  });

  // Também emitir no canal do pedido (compatível com orderService)
  try {
    const io = getIO();
    io.to("order:" + delivery.id_pedido).emit("delivery:location", {
      orderId: String(delivery.id_pedido),
      latitude: lat,
      longitude: lng,
      atualizadoEm: new Date(),
    });
  } catch (_) {}

  return { success: true };
}

/**
 * Confirmar entrega com código de confirmação.
 */
async function confirmDelivery(deliveryId, entregadorId, codigo) {
  const delivery = await findDeliveryOrThrow({ _id: deliveryId });

  if (String(delivery.id_entregador) !== String(entregadorId)) {
    throw createError("Você não é o entregador desta entrega", 403);
  }

  if (delivery.status !== "em_transito") {
    throw createError("Entrega precisa estar em trânsito para confirmar", 400);
  }

  if (delivery.codigo_confirmacao !== codigo) {
    throw createError("Código de confirmação inválido", 400);
  }

  return updateDeliveryStatus(deliveryId, "entregue", {
    entregadorId,
    observacao: "Entrega confirmada com código",
  });
}

/**
 * Cliente avalia a entrega.
 */
async function rateDeliveryByClient(deliveryId, clienteId, { nota, comentario }) {
  const delivery = await findDeliveryOrThrow({ _id: deliveryId });

  if (String(delivery.id_cliente) !== String(clienteId)) {
    throw createError("Entrega não encontrada", 404);
  }
  if (delivery.status !== "entregue") {
    throw createError("Só é possível avaliar entregas finalizadas", 400);
  }
  if (delivery.avaliacao_cliente?.avaliado_em) {
    throw createError("Entrega já avaliada", 400);
  }

  const notaNum = Number(nota);
  if (!Number.isFinite(notaNum) || notaNum < 1 || notaNum > 5) {
    throw createError("Nota deve ser entre 1 e 5", 400);
  }

  delivery.avaliacao_cliente = { nota: notaNum, comentario, avaliado_em: new Date() };
  await delivery.save();

  // Atualizar média do entregador
  if (delivery.id_entregador) {
    const entregador = await User.findById(delivery.id_entregador);
    if (entregador?.dados_entregador) {
      const totalAval = (entregador.dados_entregador.total_avaliacoes || 0) + 1;
      const mediaAnterior = entregador.dados_entregador.avaliacao || 0;
      const novaMedia = ((mediaAnterior * (totalAval - 1)) + notaNum) / totalAval;

      entregador.dados_entregador.avaliacao = Math.round(novaMedia * 100) / 100;
      entregador.dados_entregador.total_avaliacoes = totalAval;
      await entregador.save();
    }
  }

  return delivery;
}

/**
 * Entregador avalia o cliente.
 */
async function rateDeliveryByDriver(deliveryId, entregadorId, { nota, comentario }) {
  const delivery = await findDeliveryOrThrow({ _id: deliveryId });

  if (String(delivery.id_entregador) !== String(entregadorId)) {
    throw createError("Entrega não encontrada", 404);
  }
  if (delivery.status !== "entregue") {
    throw createError("Só é possível avaliar entregas finalizadas", 400);
  }
  if (delivery.avaliacao_entregador?.avaliado_em) {
    throw createError("Você já avaliou esta entrega", 400);
  }

  const notaNum = Number(nota);
  if (!Number.isFinite(notaNum) || notaNum < 1 || notaNum > 5) {
    throw createError("Nota deve ser entre 1 e 5", 400);
  }

  delivery.avaliacao_entregador = { nota: notaNum, comentario, avaliado_em: new Date() };
  await delivery.save();

  return delivery;
}

/**
 * Cancelar entrega (farmácia, entregador ou admin).
 */
async function cancelDelivery(deliveryId, { userId, userRole, motivo }) {
  const delivery = await findDeliveryOrThrow({ _id: deliveryId });

  if (delivery.status === "entregue" || delivery.status === "cancelada") {
    throw createError("Entrega não pode ser cancelada neste status", 400);
  }

  if (userRole === "entregador" && String(delivery.id_entregador) !== String(userId)) {
    throw createError("Você não é o entregador desta entrega", 403);
  }

  return updateDeliveryStatus(deliveryId, "cancelada", {
    entregadorId: userRole === "entregador" ? userId : undefined,
    observacao: motivo || "Cancelada",
  });
}

module.exports = {
  createDelivery,
  getAvailableDeliveries,
  getMyDeliveries,
  getDeliveryById,
  acceptDelivery,
  updateDeliveryStatus,
  updateLocation,
  confirmDelivery,
  rateDeliveryByClient,
  rateDeliveryByDriver,
  cancelDelivery,
};
