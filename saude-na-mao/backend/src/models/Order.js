const mongoose = require("mongoose");

const ORDER_STATUS = [
  "aguardando_pagamento",
  "em_processamento",
  "a_caminho",
  "entregue",
  "cancelado",
  "rejeitado",
];

const PAYMENT_STATUS = ["pendente", "aprovado", "falhou", "estornado"];

const orderItemSchema = new mongoose.Schema(
  {
    id_produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    nome_produto: {
      type: String,
      trim: true,
    },
    preco_unitario: {
      type: Number,
      min: 0,
    },
    quantidade: {
      type: Number,
      min: 1,
    },
    subtotal: {
      type: Number,
      min: 0,
    },
    controlado: {
      type: Boolean,
      default: false,
    },
    id_receita: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },
  },
  {
    _id: false,
  },
);

const enderecoEntregaSchema = new mongoose.Schema(
  {
    logradouro: {
      type: String,
      trim: true,
    },
    numero: {
      type: String,
      trim: true,
    },
    complemento: {
      type: String,
      trim: true,
    },
    bairro: {
      type: String,
      trim: true,
    },
    cidade: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      trim: true,
      uppercase: true,
      maxLength: 2,
    },
    cep: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const historicoStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      trim: true,
    },
    alterado_em: {
      type: Date,
      default: Date.now,
    },
    observacao: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const localizacaoAtualSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    atualizado_em: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const entregadorSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      trim: true,
    },
    telefone: {
      type: String,
      trim: true,
    },
    veiculo: {
      type: String,
      trim: true,
    },
    localizacao_atual: {
      type: localizacaoAtualSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    id_farmacia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    itens: {
      type: [orderItemSchema],
      default: [],
    },
    tipo_entrega: {
      type: String,
      enum: ["moto", "drone", "retirada", "drive-thru"],
      required: true,
    },
    endereco_entrega: {
      type: enderecoEntregaSchema,
      default: () => ({}),
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxa_entrega: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: "aguardando_pagamento",
      index: true,
    },
    status_pagamento: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pendente",
    },
    tempo_estimado_entrega: {
      type: Number,
      min: 0,
    },
    entregador: {
      type: entregadorSchema,
      default: () => ({}),
    },
    codigo_retirada: {
      type: String,
      trim: true,
    },
    avaliacao_entrega: {
      type: Number,
      min: 1,
      max: 5,
    },
    comentario_avaliacao: {
      type: String,
      trim: true,
    },
    avaliado_em: {
      type: Date,
    },
    cancelado_em: {
      type: Date,
    },
    motivo_cancelamento: {
      type: String,
      trim: true,
    },
    historico_status: {
      type: [historicoStatusSchema],
      default: [],
    },
    notificacoes_enviadas: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.methods.adicionarHistoricoStatus = function (novoStatus, obs) {
  this.historico_status.push({
    status: novoStatus,
    observacao: obs,
  });
  this.status = novoStatus;
};

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
