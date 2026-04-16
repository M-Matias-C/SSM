const orderService = require("../services/orderService");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendSuccess(res, { statusCode = 200, message = "", data = {} }) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

async function createOrder(req, res, next) {
  try {
    const pedido = await orderService.createOrder(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: "Pedido criado com sucesso",
      data: { pedido },
    });
  } catch (error) {
    return next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const pedido = await orderService.getOrderById(id, req.user.id);

    return sendSuccess(res, { data: { pedido } });
  } catch (error) {
    return next(error);
  }
}

async function getUserOrders(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const pedidos = await orderService.getUserOrders(req.user.id, {
      page,
      limit,
      status,
    });

    return sendSuccess(res, { data: pedidos });
  } catch (error) {
    return next(error);
  }
}

async function getPharmacyOrders(req, res, next) {
  try {
    const { pharmacyId } = req.params;
    const { page, limit, status } = req.query;
    const pedidos = await orderService.getPharmacyOrders(pharmacyId, {
      page,
      limit,
      status,
    });

    return sendSuccess(res, { data: pedidos });
  } catch (error) {
    return next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { novoStatus, observacao, entregador, pharmacyId } = req.body;

    if (req.user.tipo_usuario === "farmacia" && !pharmacyId) {
      throw createError("pharmacyId é obrigatório para atualizar pedido", 400);
    }

    const pedido = await orderService.updateOrderStatus(id, novoStatus, {
      usuarioId: req.user.tipo_usuario === "cliente" ? req.user.id : undefined,
      pharmacyId: req.user.tipo_usuario === "farmacia" ? pharmacyId : undefined,
      observacao,
      entregador,
    });

    return sendSuccess(res, {
      message: "Status atualizado",
      data: { pedido },
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const pedido = await orderService.cancelOrder(id, req.user.id);

    return sendSuccess(res, {
      message: "Pedido cancelado",
      data: { pedido },
    });
  } catch (error) {
    return next(error);
  }
}

async function rejectOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { motivo, pharmacyId } = req.body;

    if (req.user.tipo_usuario === "farmacia" && !pharmacyId) {
      throw createError("pharmacyId é obrigatório para rejeitar pedido", 400);
    }

    const pedido = await orderService.rejectOrder(
      id,
      req.user.tipo_usuario === "farmacia" ? pharmacyId : undefined,
      motivo,
    );

    return sendSuccess(res, {
      message: "Pedido rejeitado",
      data: { pedido },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateDeliveryLocation(req, res, next) {
  try {
    const { id } = req.params;
    const { latitude, longitude, pharmacyId } = req.body;

    if (req.user.tipo_usuario === "farmacia" && !pharmacyId) {
      throw createError(
        "pharmacyId é obrigatório para atualizar localização do pedido",
        400,
      );
    }

    await orderService.updateDeliveryLocation(id, {
      latitude,
      longitude,
      pharmacyId: req.user.tipo_usuario === "farmacia" ? pharmacyId : undefined,
    });

    return sendSuccess(res, {
      message: "Localização atualizada",
      data: {},
    });
  } catch (error) {
    return next(error);
  }
}

async function rateDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const { nota, comentario } = req.body;
    const pedido = await orderService.rateDelivery(id, req.user.id, {
      nota,
      comentario,
    });

    return sendSuccess(res, {
      message: "Avaliação registrada",
      data: { pedido },
    });
  } catch (error) {
    return next(error);
  }
}

async function generatePickupCode(req, res, next) {
  try {
    const { id } = req.params;
    const { pharmacyId } = req.body;

    if (req.user.tipo_usuario === "farmacia" && !pharmacyId) {
      throw createError(
        "pharmacyId é obrigatório para gerar código de retirada",
        400,
      );
    }

    const codigo_retirada = await orderService.generatePickupCode(
      id,
      req.user.tipo_usuario === "farmacia" ? pharmacyId : undefined,
    );

    return sendSuccess(res, {
      data: { codigo_retirada },
    });
  } catch (error) {
    return next(error);
  }
}

async function getOrderStats(req, res, next) {
  try {
    const { pharmacyId } = req.params;
    const stats = await orderService.getOrderStats(pharmacyId);

    return sendSuccess(res, {
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
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
