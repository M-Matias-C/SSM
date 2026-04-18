const mongoose = require("mongoose");

const PharmacistSchema = new mongoose.Schema(
  {
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    telefone: {
      type: String,
      trim: true,
    },
    crm: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    crm_verificado: {
      type: Boolean,
      default: false,
    },
    id_farmacia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    especialidades: [
      {
        type: String,
        enum: [
          "farmacologia_clinica",
          "farmacovigilancia",
          "farmacoeconomia",
          "analises_clinicas",
          "cosmetologia",
          "nutricao",
          "homeopatia",
          "fitoterapia",
          "outras",
        ],
      },
    ],
    foto: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    disponivel_chat: {
      type: Boolean,
      default: true,
    },
    horario_inicio: {
      type: String,
      default: "09:00",
    },
    horario_fim: {
      type: String,
      default: "18:00",
    },
    dias_atendimento: [
      {
        type: String,
        enum: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"],
      },
    ],
    tempo_resposta_medio: {
      type: Number,
      default: 30,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    total_avaliacoes: {
      type: Number,
      default: 0,
    },
    chats_ativos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
    ativo: {
      type: Boolean,
      default: true,
    },
    data_cadastro: {
      type: Date,
      default: Date.now,
    },
    data_atualizacao: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "pharmacists",
  }
);

PharmacistSchema.index({ id_farmacia: 1 });
PharmacistSchema.index({ disponivel_chat: 1 });

module.exports = mongoose.model("Pharmacist", PharmacistSchema);
