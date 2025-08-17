module.exports = (err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Ocurrió un error en el servidor.',
    message: err.message,
  });
};
// server/src/middleware/errorHandler.js
// Manejo de errores para la API, captura errores y envía una respuesta JSON adecuada