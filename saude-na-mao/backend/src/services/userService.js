const mongoose = require("mongoose");
const User = require("../models/User");
const Address = require("../models/Adress");
const Order = require("../models/Order");
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

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getOrderHistory,
};
