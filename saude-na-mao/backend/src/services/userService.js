const mongoose = require("mongoose");
const User = require("../models/User");
const Address = require("../models/Address");
const Order = require("../models/Order");
const Prescription = require("../models/Prescription");
const { buscarCep } = require("../utils/viaCep");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeObjectId(id) {
  if (typeof id !== "string") {
    throw createError("ID de endereço inválido", 400);
  }

  const normalizedId = id.trim().replace(/^\{+|\}+$/g, "");

  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    throw createError("ID de endereço inválido", 400);
  }

  return normalizedId;
}

async function getProfile(userId) {
  const user = await User.findById(userId).select("-senha");
  if (!user) {
    throw createError("Usuário não encontrado", 404);
  }
  const enderecos = await Address.find({ id_usuario: userId, ativo: true });
  return { user, enderecos };
}

async function updateProfile(userId, updates) {
  const allowedFields = ["nome", "telefone", "fotoPerfil"];
  const updateData = {};
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  });
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-senha");
  if (!user) {
    throw createError("Usuário não encontrado", 404);
  }
  return user;
}

async function addAddress(userId, dadosEndereco) {
  const activeCount = await Address.countDocuments({
    id_usuario: userId,
    ativo: true,
  });
  if (activeCount >= 10) {
    throw createError("Limite de 10 endereços atingido", 400);
  }
  if (dadosEndereco.cep && !dadosEndereco.logradouro) {
    const cepData = await buscarCep(dadosEndereco.cep);
    dadosEndereco.logradouro = cepData.logradouro;
    dadosEndereco.bairro = cepData.bairro;
    dadosEndereco.cidade = cepData.cidade;
    dadosEndereco.estado = cepData.estado;
  }
  const isFirst = activeCount === 0;
  const address = new Address({
    ...dadosEndereco,
    id_usuario: userId,
    padrao: isFirst,
  });
  await address.save();
  return address;
}

async function updateAddress(userId, addressId, dadosEndereco) {
  const normalizedAddressId = normalizeObjectId(addressId);
  const address = await Address.findOne({
    _id: normalizedAddressId,
    id_usuario: userId,
  });
  if (!address) {
    throw createError("Endereço não encontrado", 404);
  }
  Object.assign(address, dadosEndereco);
  await address.save();
  return address;
}

async function deleteAddress(userId, addressId) {
  const normalizedAddressId = normalizeObjectId(addressId);
  const address = await Address.findOne({
    _id: normalizedAddressId,
    id_usuario: userId,
  });
  if (!address) {
    throw createError("Endereço não encontrado", 404);
  }
  if (address.padrao) {
    const nextDefault = await Address.findOne({
      id_usuario: userId,
      ativo: true,
      _id: { $ne: normalizedAddressId },
    });
    if (nextDefault) {
      nextDefault.padrao = true;
      await nextDefault.save();
    }
  }
  address.ativo = false;
  await address.save();
  return { message: "Endereço removido com sucesso" };
}

async function setDefaultAddress(userId, addressId) {
  const normalizedAddressId = normalizeObjectId(addressId);
  const address = await Address.findOne({
    _id: normalizedAddressId,
    id_usuario: userId,
  });
  if (!address) {
    throw createError("Endereço não encontrado", 404);
  }
  address.padrao = true;
  await address.save();
  return address;
}

async function getOrderHistory(userId, { page = 1, limit = 10 }) {
  const pagina = Number(page);
  const limite = Number(limit);
  const total = await Order.countDocuments({ id_usuario: userId });
  const pedidos = await Order.find({ id_usuario: userId })
    .sort({ createdAt: -1 })
    .skip((pagina - 1) * limite)
    .limit(limite)
    .populate("id_farmacia", "nome cidade estado");
  const totalPaginas = Math.ceil(total / limite);
  return { pedidos, total, pagina, totalPaginas };
}

/**
 * LGPD - Exporta todos os dados do usuário (Art. 18, V da LGPD)
 */
async function exportUserData(userId) {
  const user = await User.findById(userId).select("-senha -refreshToken -resetPasswordToken -resetPasswordExpire");
  if (!user) {
    throw createError("Usuário não encontrado", 404);
  }

  const [enderecos, pedidos, receitas] = await Promise.all([
    Address.find({ id_usuario: userId }),
    Order.find({ id_usuario: userId }).populate("id_farmacia", "nome").sort({ createdAt: -1 }),
    Prescription.find({ id_usuario: userId }).sort({ createdAt: -1 }),
  ]);

  return {
    dados_pessoais: {
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      cpf: user.cpf,
      tipo_usuario: user.tipo_usuario,
      data_cadastro: user.data_cadastro,
      lgpd_consentimento: user.lgpd_consentimento,
    },
    enderecos: enderecos.map((e) => ({
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
      cep: e.cep,
    })),
    pedidos: pedidos.map((p) => ({
      id: p._id,
      data: p.createdAt,
      status: p.status,
      total: p.total,
      farmacia: p.id_farmacia?.nome,
      itens: p.itens.map((i) => ({
        nome: i.nome_produto,
        quantidade: i.quantidade,
        preco: i.preco_unitario,
      })),
      numero_nf: p.numero_nf,
    })),
    receitas: receitas.map((r) => ({
      id: r._id,
      data: r.createdAt,
      status: r.status,
      tipo_receita: r.tipo_receita,
      consumida: r.consumida,
      dados_ocr: r.dados_ocr ? {
        nome_medico: r.dados_ocr.nome_medico,
        crm: r.dados_ocr.crm,
        data_emissao: r.dados_ocr.data_emissao,
      } : null,
    })),
    exportado_em: new Date(),
  };
}

/**
 * LGPD - Solicita exclusão da conta (Art. 18, VI da LGPD)
 * Anonimiza dados pessoais mas mantém registros de pedidos por obrigação fiscal.
 */
async function requestAccountDeletion(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw createError("Usuário não encontrado", 404);
  }

  const activeOrders = await Order.countDocuments({
    id_usuario: userId,
    status: { $in: ["aguardando_pagamento", "em_processamento", "a_caminho"] },
  });

  if (activeOrders > 0) {
    throw createError(
      "Não é possível excluir a conta com pedidos em andamento. Aguarde a conclusão dos pedidos.",
      400,
    );
  }

  // Anonimize personal data
  user.nome = "Usuário Removido";
  user.email = `deleted_${userId}@removed.local`;
  user.telefone = null;
  user.cpf = null;
  user.foto_perfil = null;
  user.ativo = false;
  user.lgpd_consentimento = {
    ...user.lgpd_consentimento?.toObject?.() || user.lgpd_consentimento || {},
    conta_excluida_em: new Date(),
  };

  await user.save();

  // Deactivate all addresses
  await Address.updateMany(
    { id_usuario: userId },
    { $set: { ativo: false } },
  );

  return { message: "Conta excluída com sucesso. Dados pessoais foram anonimizados." };
}

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getOrderHistory,
  exportUserData,
  requestAccountDeletion,
};
