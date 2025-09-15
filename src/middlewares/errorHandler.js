export default function errorHandler(err, req, res, next) {
  console.error("❌ Erro capturado:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erro interno no servidor",
  });
}
