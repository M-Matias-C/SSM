const Prescription = require("../models/Prescription");
const User = require("../models/User");
const ocrService = require("./ocrService");
const notificationService = require("./notificationService");
const path = require("path");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function calculateValidity(baseDate) {
  const validade = new Date(baseDate || new Date());
  validade.setMonth(validade.getMonth() + 6);
  return validade;
}

async function getUserForNotification(userId) {
  return User.findById(userId).select("+fcmToken nome email telefone");
}

function buildPagination(page, limit, total) {
  return {
    pagina: page,
    totalPaginas: total > 0 ? Math.ceil(total / limit) : 0,
  };
}

async function processPrescriptionOCR(prescriptionId, filePath, mimeType) {
  let prescription = null;

  try {
    prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return;
    }

    prescription.adicionarHistorico(
      "Em Análise",
      null,
      "Processamento OCR iniciado automaticamente",
    );
    await prescription.save();

    const rawText = await ocrService.extractText(filePath, mimeType);
    const dadosOcr = ocrService.parseReceiptData(rawText);
    const validacaoCrm = await ocrService.validateCRM(
      dadosOcr.crm,
      dadosOcr.uf_crm,
    );

    prescription.dados_ocr = dadosOcr;
    prescription.validacao_crm = validacaoCrm;
    prescription.validade = calculateValidity(
      dadosOcr.data_emissao || new Date(),
    );

    await prescription.save();

    const usuario = await getUserForNotification(prescription.id_usuario);
    if (usuario) {
      await notificationService.sendPrescriptionStatusNotification(
        usuario,
        prescription,
        "Em Análise",
      );
    }
  } catch (error) {
    console.error(
      `Erro ao processar OCR da receita ${prescriptionId}:`,
      error.message,
    );

    if (prescription) {
      try {
        prescription.adicionarHistorico(
          "Pendente",
          null,
          "Falha no processamento OCR. Aguardando revisão manual",
        );
        await prescription.save();
      } catch (saveError) {
        console.error(
          `Erro ao restaurar status da receita ${prescriptionId}:`,
          saveError.message,
        );
      }
    }
  }
}

async function uploadPrescription(userId, file) {
  const filePath = path.normalize(file.path);

  const prescription = await Prescription.create({
    id_usuario: userId,
    url_arquivo: filePath,
    nome_arquivo: file.originalname,
    tipo_arquivo: file.mimetype,
    tamanho_arquivo: file.size,
  });

  processPrescriptionOCR(prescription._id, filePath, file.mimetype);

  const usuario = await getUserForNotification(userId);
  if (usuario) {
    await notificationService.sendPrescriptionStatusNotification(
      usuario,
      prescription,
      "Pendente",
    );
  }

  return prescription;
}

async function getUserPrescriptions(
  userId,
  { page = 1, limit = 10, status } = {},
) {
  const pagina = Number(page) || 1;
  const limite = Number(limit) || 10;
  const filtro = { id_usuario: userId };

  if (status) {
    filtro.status = status;
  }

  const [receitas, total] = await Promise.all([
    Prescription.find(filtro)
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
    Prescription.countDocuments(filtro),
  ]);

  return {
    receitas,
    total,
    ...buildPagination(pagina, limite, total),
  };
}

async function getPrescriptionById(prescriptionId, userId) {
  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription || String(prescription.id_usuario) !== String(userId)) {
    throw createError("Receita não encontrada", 404);
  }

  return prescription;
}

async function validatePrescription(
  prescriptionId,
  farmaceuticoId,
  { aprovado, observacoes, validade },
) {
  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription) {
    throw createError("Receita não encontrada", 404);
  }

  if (!["Pendente", "Em Análise"].includes(prescription.status)) {
    throw createError("Receita não pode ser validada neste status", 400);
  }

  const novoStatus = aprovado ? "Aprovada" : "Rejeitada";
  prescription.adicionarHistorico(novoStatus, farmaceuticoId, observacoes);
  prescription.validado_por = farmaceuticoId;
  prescription.validado_em = new Date();
  prescription.observacoes = observacoes;

  if (aprovado && validade) {
    prescription.validade = validade;
  }

  await prescription.save();

  const usuario = await getUserForNotification(prescription.id_usuario);
  if (usuario) {
    await notificationService.sendPrescriptionStatusNotification(
      usuario,
      prescription,
      novoStatus,
    );
  }

  return prescription;
}

async function cancelPrescription(prescriptionId, userId) {
  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    id_usuario: userId,
  });

  if (!prescription) {
    throw createError("Receita não encontrada", 404);
  }

  if (prescription.status === "Aprovada") {
    throw createError("Receita aprovada não pode ser cancelada", 400);
  }

  prescription.adicionarHistorico(
    "Cancelada",
    userId,
    "Cancelada pelo usuário",
  );
  await prescription.save();

  return prescription;
}

async function expirePrescriptions() {
  const now = new Date();
  const prescriptions = await Prescription.find({
    status: "Aprovada",
    validade: { $lt: now },
  });

  for (const prescription of prescriptions) {
    prescription.adicionarHistorico(
      "Expirada",
      null,
      "Expirada automaticamente",
    );
    await prescription.save();

    const usuario = await getUserForNotification(prescription.id_usuario);
    if (usuario) {
      await notificationService.sendPrescriptionStatusNotification(
        usuario,
        prescription,
        "Expirada",
      );
    }
  }

  console.log(`${prescriptions.length} receitas expiradas automaticamente`);
  return prescriptions.length;
}

async function getPendingPrescriptions({ page = 1, limit = 20 } = {}) {
  const pagina = Number(page) || 1;
  const limite = Number(limit) || 20;
  const filtro = { status: { $in: ["Pendente", "Em Análise"] } };

  const [receitas, total] = await Promise.all([
    Prescription.find(filtro)
      .populate("id_usuario", "nome email telefone")
      .sort({ createdAt: 1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
    Prescription.countDocuments(filtro),
  ]);

  return {
    receitas,
    total,
    ...buildPagination(pagina, limite, total),
  };
}

module.exports = {
  uploadPrescription,
  getUserPrescriptions,
  getPrescriptionById,
  validatePrescription,
  cancelPrescription,
  expirePrescriptions,
  getPendingPrescriptions,
};
