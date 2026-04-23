const prescriptionService = require("../services/prescriptionService");
const notificationService = require("../services/notificationService");
const User = require("../models/User");

async function uploadPrescription(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "Nenhum arquivo enviado",
      });
    }

    const receita = await prescriptionService.uploadPrescription(
      req.user.id,
      req.file,
    );

    return res.status(201).json({
      success: true,
      message:
        "Receita recebida com sucesso. Você será notificado sobre o resultado da validação.",
      data: { receita },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserPrescriptions(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const resultado = await prescriptionService.getUserPrescriptions(
      req.user.id,
      { page, limit, status },
    );

    return res.status(200).json({
      success: true,
      data: resultado,
      message: "Receitas listadas com sucesso",
    });
  } catch (error) {
    return next(error);
  }
}

async function getPrescriptionById(req, res, next) {
  try {
    const { id } = req.params;
    const receita = await prescriptionService.getPrescriptionById(
      id,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      data: { receita },
      message: "Receita carregada com sucesso",
    });
  } catch (error) {
    return next(error);
  }
}

async function validatePrescription(req, res, next) {
  try {
    const { id } = req.params;
    const { aprovado, observacoes, validade } = req.body;
    const receita = await prescriptionService.validatePrescription(
      id,
      req.user.id,
      { aprovado, observacoes, validade },
    );

    return res.status(200).json({
      success: true,
      message: aprovado ? "Receita aprovada" : "Receita rejeitada",
      data: { receita },
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelPrescription(req, res, next) {
  try {
    const { id } = req.params;
    const receita = await prescriptionService.cancelPrescription(
      id,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Receita cancelada",
      data: { receita },
    });
  } catch (error) {
    return next(error);
  }
}

async function getPendingPrescriptions(req, res, next) {
  try {
    const { page, limit } = req.query;
    const resultado = await prescriptionService.getPendingPrescriptions({
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: resultado,
      message: "Receitas pendentes listadas com sucesso",
    });
  } catch (error) {
    return next(error);
  }
}

async function updateFcmToken(req, res, next) {
  try {
    const { fcmToken } = req.body;

    if (
      fcmToken !== null &&
      fcmToken !== undefined &&
      !notificationService.isLikelyValidFcmToken(fcmToken)
    ) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "Token FCM inválido",
      });
    }

    await User.findByIdAndUpdate(req.user.id, { fcmToken });

    return res.status(200).json({
      success: true,
      data: {},
      message: "Token de notificação atualizado",
    });
  } catch (error) {
    return next(error);
  }
}

async function getReceitaDigital(req, res, next) {
  try {
    const { id } = req.params;
    const receita = await prescriptionService.getReceitaDigital(id, req.user.id);

    if (!receita) {
      return res.status(404).json({
        success: false,
        data: {},
        message: "Receita digital não encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: receita,
      message: "Receita digital recuperada com sucesso",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadPrescription,
  getUserPrescriptions,
  getPrescriptionById,
  validatePrescription,
  cancelPrescription,
  getPendingPrescriptions,
  updateFcmToken,
  getReceitaDigital,
};
