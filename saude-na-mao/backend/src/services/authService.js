const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

function generateAccessToken(userId, tipo_usuario) {
  return jwt.sign({ id: userId, tipo: tipo_usuario }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

async function registerUser({
  nome,
  email,
  telefone,
  cpf,
  senha,
  tipo_usuario,
}) {
  if (await User.findOne({ email })) {
    throw new Error("E-mail já cadastrado");
  }
  if (cpf && (await User.findOne({ cpf }))) {
    throw new Error("CPF já cadastrado");
  }
  const user = await User.create({
    nome,
    email,
    telefone,
    cpf,
    senha,
    tipo_usuario,
  });
  const userObj = user.toObject();
  delete userObj.senha;
  return userObj;
}

async function loginUser({ email, senha }) {
  const user = await User.findOne({ email }).select(
    "+senha +loginAttempts +lockUntil +refreshToken",
  );
  if (!user) {
    throw new Error("Credenciais inválidas");
  }
  if (user.isLocked) {
    throw new Error("Conta bloqueada por 15 minutos");
  }
  const senhaCorreta = await user.comparePassword(senha);
  if (!senhaCorreta) {
    await user.incrementLoginAttempts();
    throw new Error("Credenciais inválidas");
  }
  await user.resetLoginAttempts();
  const accessToken = generateAccessToken(user._id, user.tipo_usuario);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  const userObj = user.toObject();
  delete userObj.senha;
  delete userObj.refreshToken;
  return { accessToken, refreshToken, user: userObj };
}

async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error("Refresh token inválido");
  }
  const user = await User.findById(payload.id).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    throw new Error("Refresh token inválido");
  }
  return generateAccessToken(user._id, user.tipo_usuario);
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Usuário não encontrado");
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  user.resetPasswordToken = hash;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos
  await user.save();
  return token;
}

async function resetPassword(token, novaSenha) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hash,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+senha +resetPasswordToken +resetPasswordExpire");
  if (!user) throw new Error("Token inválido ou expirado");
  user.senha = novaSenha;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  const userObj = user.toObject();
  delete userObj.senha;
  return userObj;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  registerUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
};
