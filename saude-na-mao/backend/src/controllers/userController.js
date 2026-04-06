const userService = require("../services/userService");
const Address = require("../models/Adress");
const { buscarCep } = require("../utils/viaCep");

async function getProfile(req, res, next) {
  try {
    const { user, enderecos } = await userService.getProfile(req.user.id);
    res.json({ success: true, data: { user, enderecos } });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { nome, telefone } = req.body;
    const updateData = { nome, telefone };
    if (req.file) {
      updateData.fotoPerfil = req.file.path;
    }
    const user = await userService.updateProfile(req.user.id, updateData);
    res.json({ success: true, message: "Perfil atualizado", data: { user } });
  } catch (error) {
    next(error);
  }
}

async function listAddresses(req, res, next) {
  try {
    const enderecos = await Address.find({
      id_usuario: req.user.id,
      ativo: true,
    });
    res.json({ success: true, data: { enderecos } });
  } catch (error) {
    next(error);
  }
}

async function addAddress(req, res, next) {
  try {
    const endereco = await userService.addAddress(req.user.id, req.body);
    res
      .status(201)
      .json({
        success: true,
        message: "Endereço adicionado",
        data: { endereco },
      });
  } catch (error) {
    next(error);
  }
}

async function updateAddress(req, res, next) {
  try {
    const addressId = req.params.id;
    const endereco = await userService.updateAddress(
      req.user.id,
      addressId,
      req.body,
    );
    res.json({
      success: true,
      message: "Endereço atualizado",
      data: { endereco },
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const addressId = req.params.id;
    await userService.deleteAddress(req.user.id, addressId);
    res.json({ success: true, message: "Endereço removido" });
  } catch (error) {
    next(error);
  }
}

async function setDefaultAddress(req, res, next) {
  try {
    const addressId = req.params.id;
    const endereco = await userService.setDefaultAddress(
      req.user.id,
      addressId,
    );
    res.json({
      success: true,
      message: "Endereço padrão definido",
      data: { endereco },
    });
  } catch (error) {
    next(error);
  }
}

async function getOrderHistory(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const resultado = await userService.getOrderHistory(req.user.id, {
      page,
      limit,
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
}

async function searchCep(req, res, next) {
  try {
    const cep = req.params.cep;
    const endereco = await buscarCep(cep);
    res.json({ success: true, data: endereco });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getOrderHistory,
  searchCep,
};
