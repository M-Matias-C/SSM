const authService = require("../services/authService");
const sendEmail = require("../utils/sendEmail");

exports.register = async (req, res, next) => {
  try {
    const { nome, email, telefone, cpf, senha, tipo_usuario } = req.body;
    const user = await authService.registerUser({
      nome,
      email,
      telefone,
      cpf,
      senha,
      tipo_usuario,
    });
    return res.status(201).json({
      success: true,
      message: "Cadastro realizado com sucesso",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser({
      email,
      senha,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
    return res.json({
      success: true,
      data: { accessToken, user },
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token não encontrado" });
    }
    const accessToken = await authService.refreshAccessToken(refreshToken);
    return res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    res.clearCookie("refreshToken");
    return res.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let token;
    try {
      token = await authService.forgotPassword(email);
      await sendEmail({
        to: email,
        subject: "Recuperação de senha - Saúde Na Mão",
        text: `Seu token de recuperação é: ${token} (válido por 10 minutos)`,
      });
    } catch (e) {
      // Mesmo que o e-mail não exista, retorna sucesso por segurança
    }
    return res.json({
      success: true,
      message: "E-mail de recuperação enviado",
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { novaSenha } = req.body;
    await authService.resetPassword(token, novaSenha);
    return res.json({
      success: true,
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    next(error);
  }
};
