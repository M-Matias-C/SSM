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
    enum: ["cliente", "administrador", "farmacia"],
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
});

UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
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

if (mongoosePaginate) {
  UserSchema.plugin(mongoosePaginate);
}

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
