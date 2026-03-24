// Global error handling middleware — catches errors passed via next(err)
function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
}

module.exports = errorHandler;
