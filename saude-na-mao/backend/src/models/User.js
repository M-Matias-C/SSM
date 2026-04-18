const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
let mongoosePaginate;
try {
  mongoosePaginate = require("mongoose-paginate-v2");
} catch (e) {
  mongoosePaginate = null;
}

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  telefone: {
    type: String,
  },
  senha: {
    type: String,
    required: true,
    select: false,
  },
  cpf: {
    type: String,
    unique: true,
    sparse: true,
  },
  tipo_usuario: {
    type: String,
    enum: ["cliente", "entregador", "dono_farmacia", "farmaceutico", "administrador"],
    default: "cliente",
  },
  data_cadastro: {
    type: Date,
    default: Date.now,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  fcmToken: {
    type: String,
    default: null,
    select: false,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpire: {
    type: Date,
    select: false,
  },
  ativo: {
    type: Boolean,
    default: true,
  },
  foto_perfil: {
    type: String,
    default: null,
  },
  google_id: {
    type: String,
    default: null,
    sparse: true,
  },
  lgpd_consentimento: {
    aceito: { type: Boolean, default: false },
    data_aceite: { type: Date },
    ip_aceite: { type: String },
    versao_termo: { type: String, default: "1.0" },
  },
  dados_entregador: {
    tipo_veiculo: {
      type: String,
      enum: ["moto", "bicicleta", "carro"],
    },
    placa: { type: String, trim: true },
    cnh: { type: String, trim: true },
    disponivel: { type: Boolean, default: false },
    localizacao_atual: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    entregas_realizadas: { type: Number, default: 0 },
    avaliacao: { type: Number, default: 0, min: 0, max: 5 },
    total_avaliacoes: { type: Number, default: 0 },
  },
  dados_dono_farmacia: {
    id_farmacia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
    },
  },
  dados_farmaceutico: {
    id_farmacia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
    },
    crf: { type: String, trim: true },
    crf_verificado: { type: Boolean, default: false },
    especialidades: [{
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
    }],
  },
});

UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

UserSchema.pre("save", async function () {
  if (!this.isModified("senha")) return;
  const salt = await bcrypt.genSalt(12);
  this.senha = await bcrypt.hash(this.senha, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.senha);
};

UserSchema.index(
  { "dados_entregador.localizacao_atual": "2dsphere" },
  { partialFilterExpression: { tipo_usuario: "entregador", "dados_entregador.localizacao_atual.coordinates": { $exists: true } } }
);

if (mongoosePaginate) {
  UserSchema.plugin(mongoosePaginate);
}

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
