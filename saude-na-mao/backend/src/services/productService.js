const mongoose = require("mongoose");
const Product = require("../models/Product");
const Pharmacy = require("../models/Pharmacy");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function searchProducts({
  termo,
  categoria,
  id_farmacia,
  preco_min,
  preco_max,
  disponivel,
  controlado,
  ordenar = "relevancia",
  page = 1,
  limit = 20,
} = {}) {
  const filtro = { ativo: true };

  if (termo) {
    filtro.$text = { $search: termo };
  }

  if (categoria) {
    filtro.categoria = new RegExp(categoria, "i");
  }

  if (id_farmacia) {
    filtro.id_farmacia = id_farmacia;
  }

  if (preco_min !== undefined || preco_max !== undefined) {
    filtro.preco = {};
    if (preco_min !== undefined) filtro.preco.$gte = parseFloat(preco_min);
    if (preco_max !== undefined) filtro.preco.$lte = parseFloat(preco_max);
  }

  if (disponivel === "true") {
    filtro.estoque = { $gt: 0 };
  }

  if (controlado !== undefined) {
    filtro.controlado = controlado === "true";
  }

  let ordenacao;
  if (ordenar === "relevancia" && termo) {
    ordenacao = { score: { $meta: "textScore" } };
  } else if (ordenar === "preco_asc") {
    ordenacao = { preco: 1 };
  } else if (ordenar === "preco_desc") {
    ordenacao = { preco: -1 };
  } else if (ordenar === "nome") {
    ordenacao = { nome: 1 };
  } else if (ordenar === "nome_desc") {
    ordenacao = { nome: -1 };
  } else {
    ordenacao = { createdAt: -1 };
  }

  const resultado = await Product.paginate(filtro, {
    page,
    limit,
    sort: ordenacao,
    populate: { path: "id_farmacia", select: "nome cidade estado avaliacao" },
    projection: termo ? { score: { $meta: "textScore" } } : {},
  });

  return resultado;
}

async function getProductById(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw createError("Medicamento não encontrado", 404);
  }

  const produto = await Product.findById(productId).populate({
    path: "id_farmacia",
    select: "-__v",
  });

  if (!produto || !produto.ativo) {
    throw createError("Medicamento não encontrado", 404);
  }

  return produto;
}

async function getCategories() {
  const categorias = await Product.distinct("categoria", { ativo: true });
  return categorias.sort();
}

async function getProductsByCategory(categoria, { page = 1, limit = 20 } = {}) {
  const filtro = {
    categoria: new RegExp(categoria, "i"),
    ativo: true,
    estoque: { $gt: 0 },
  };

  const resultado = await Product.paginate(filtro, {
    page,
    limit,
    sort: { nome: 1 },
    populate: { path: "id_farmacia", select: "nome cidade estado avaliacao" },
  });

  return resultado;
}

async function createProduct(dados) {
  if (!mongoose.Types.ObjectId.isValid(dados.id_farmacia)) {
    throw createError("Farmácia não encontrada", 404);
  }

  const farmacia = await Pharmacy.findById(dados.id_farmacia);
  if (!farmacia) {
    throw createError("Farmácia não encontrada", 404);
  }

  const produto = new Product(dados);
  await produto.save();

  return produto.populate({ path: "id_farmacia", select: "-__v" });
}

async function updateProduct(productId, dados) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw createError("Medicamento não encontrado", 404);
  }

  const { id_farmacia, ...updateData } = dados;

  const produto = await Product.findByIdAndUpdate(productId, updateData, {
    new: true,
    runValidators: true,
  }).populate({ path: "id_farmacia", select: "nome cidade estado avaliacao" });

  if (!produto) {
    throw createError("Medicamento não encontrado", 404);
  }

  return produto;
}

async function updateStock(productId, quantidade) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw createError("Medicamento não encontrado", 404);
  }

  const produto = await Product.findByIdAndUpdate(
    productId,
    { $inc: { estoque: quantidade } },
    { new: true, runValidators: true },
  );

  if (!produto) {
    throw createError("Medicamento não encontrado", 404);
  }

  if (produto.estoque < 0) {
    await Product.findByIdAndUpdate(productId, {
      $inc: { estoque: -quantidade },
    });
    throw createError("Estoque insuficiente", 400);
  }

  return produto;
}

async function getFeaturedProducts(limit = 10) {
  const produtos = await Product.find({ ativo: true, estoque: { $gt: 0 } })
    .populate({ path: "id_farmacia", select: "nome cidade estado avaliacao" })
    .sort({ "id_farmacia.avaliacao": -1, createdAt: -1 })
    .limit(limit);

  return produtos;
}

module.exports = {
  searchProducts,
  getProductById,
  getCategories,
  getProductsByCategory,
  createProduct,
  updateProduct,
  updateStock,
  getFeaturedProducts,
};
