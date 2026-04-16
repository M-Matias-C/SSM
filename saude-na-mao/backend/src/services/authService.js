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
    const err = new Error("E-mail já cadastrado");
    err.statusCode = 409;
    throw err;
  }
  if (cpf && (await User.findOne({ cpf }))) {
    const err = new Error("CPF já cadastrado");
    err.statusCode = 409;
    throw err;
  }
  const user = await User.create({
    nome,
    email,
    telefone,
    cpf,
    senha,
    tipo_usuario,
  });

  const accessToken = generateAccessToken(user._id, user.tipo_usuario);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  const userObj = user.toObject();
  delete userObj.senha;
  delete userObj.refreshToken;
  return { accessToken, refreshToken, user: userObj };
}

async function loginUser({ email, senha }) {
  const user = await User.findOne({ email }).select(
    "+senha +loginAttempts +lockUntil +refreshToken",
  );
  if (!user) {
    const err = new Error("Credenciais inválidas");
    err.statusCode = 401;
    throw err;
  }
  if (user.isLocked) {
    const err = new Error("Conta bloqueada por 15 minutos");
    err.statusCode = 429;
    throw err;
  }
  const senhaCorreta = await user.comparePassword(senha);
  if (!senhaCorreta) {
    await user.incrementLoginAttempts();
    const err = new Error("Credenciais inválidas");
    err.statusCode = 401;
    throw err;
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
    const err = new Error("Refresh token inválido");
    err.statusCode = 401;
    throw err;
  }
  const user = await User.findById(payload.id).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error("Refresh token inválido");
    err.statusCode = 401;
    throw err;
  }
  return generateAccessToken(user._id, user.tipo_usuario);
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("Usuário não encontrado");
    err.statusCode = 404;
    throw err;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  user.resetPasswordToken = hash;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save();
  return token;
}

async function resetPassword(token, novaSenha) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hash,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+senha +resetPasswordToken +resetPasswordExpire");
  if (!user) {
    const err = new Error("Token inválido ou expirado");
    err.statusCode = 400;
    throw err;
  }
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
