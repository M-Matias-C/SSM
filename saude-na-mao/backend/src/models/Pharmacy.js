const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const pharmacySchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    cnpj: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    telefone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    logradouro: {
      type: String,
      required: true,
      trim: true,
    },
    numero: {
      type: String,
      required: true,
      trim: true,
    },
    complemento: {
      type: String,
      trim: true,
    },
    bairro: {
      type: String,
      required: true,
      trim: true,
    },
    cidade: {
      type: String,
      required: true,
      trim: true,
    },
    estado: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxLength: 2,
    },
    cep: {
      type: String,
      required: true,
      trim: true,
    },
    horario_funcionamento: {
      type: String,
      trim: true,
    },
    avaliacao: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    total_avaliacoes: {
      type: Number,
      default: 0,
    },
    ativa: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
  },
);

pharmacySchema.index({ location: "2dsphere" });

pharmacySchema.plugin(mongoosePaginate);

module.exports =
  mongoose.models.Pharmacy || mongoose.model("Pharmacy", pharmacySchema);
