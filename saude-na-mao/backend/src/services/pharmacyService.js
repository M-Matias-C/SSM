const mongoose = require("mongoose");
const Pharmacy = require("../models/Pharmacy");
const Product = require("../models/Product");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function listPharmacies({
  page = 1,
  limit = 10,
  cidade,
  estado,
  ativa = true,
} = {}) {
  const filtro = { ativa };
  if (cidade) filtro.cidade = { $regex: cidade, $options: "i" };
  if (estado) filtro.estado = estado.toUpperCase();

  const resultado = await Pharmacy.paginate(filtro, {
    page,
    limit,
    sort: { avaliacao: -1 },
  });

  return resultado;
}

async function getPharmacyById(pharmacyId) {
  if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
    throw createError("Farmácia não encontrada", 404);
  }

  const farmacia = await Pharmacy.findById(pharmacyId);
  if (!farmacia) {
    throw createError("Farmácia não encontrada", 404);
  }

  return farmacia;
}

async function findNearbyPharmacies({
  longitude,
  latitude,
  raioKm = 5,
  limit = 10,
}) {
  if (longitude === undefined || latitude === undefined) {
    throw createError("Longitude e latitude são obrigatórios", 400);
  }

  const lon = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lon) || isNaN(lat)) {
    throw createError("Longitude e latitude devem ser números válidos", 400);
  }

  const farmacias = await Pharmacy.find({
    ativa: true,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lon, lat] },
        $maxDistance: raioKm * 1000,
      },
    },
  }).limit(limit);

  return farmacias;
}

async function getPharmacyProducts(
  pharmacyId,
  { page = 1, limit = 20, categoria, disponivel } = {},
) {
  await getPharmacyById(pharmacyId);

  const filtro = { id_farmacia: pharmacyId, ativo: true };
  if (categoria) filtro.categoria = { $regex: categoria, $options: "i" };
  if (disponivel === "true") filtro.estoque = { $gt: 0 };

  const resultado = await Product.paginate(filtro, {
    page,
    limit,
    populate: { path: "id_farmacia", select: "nome cidade estado" },
    sort: { nome: 1 },
  });

  return resultado;
}

async function createPharmacy(dados) {
  const { latitude, longitude, ...resto } = dados;

  const existe = await Pharmacy.findOne({ cnpj: resto.cnpj });
  if (existe) {
    throw createError("CNPJ já cadastrado", 400);
  }

  const dadosFarmacia = { ...resto };
  if (latitude !== undefined && longitude !== undefined) {
    dadosFarmacia.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
  }

  const farmacia = new Pharmacy(dadosFarmacia);
  await farmacia.save();
  return farmacia;
}

async function updatePharmacy(pharmacyId, dados) {
  if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
    throw createError("Farmácia não encontrada", 404);
  }

  const { latitude, longitude, ...resto } = dados;

  const updateData = { ...resto };
  if (latitude !== undefined && longitude !== undefined) {
    updateData.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
  }

  const farmacia = await Pharmacy.findByIdAndUpdate(pharmacyId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!farmacia) {
    throw createError("Farmácia não encontrada", 404);
  }

  return farmacia;
}

module.exports = {
  listPharmacies,
  getPharmacyById,
  findNearbyPharmacies,
  getPharmacyProducts,
  createPharmacy,
  updatePharmacy,
};
