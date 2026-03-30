module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Erro interno do servidor";
  let extra = {};

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = "Email ou CPF já cadastrado";
  }
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token inválido";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expirado";
  }
  if (process.env.NODE_ENV === "development" && err.stack) {
    extra.stack = err.stack;
  }
  return res.status(statusCode).json({
    success: false,
    message,
    ...extra,
  });
};
