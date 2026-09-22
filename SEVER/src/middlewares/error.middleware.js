const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (error, req, res, next) => {
  console.error(error.stack);

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: `Invalid id: ${error.value}` });
  }

  return res.status(500).json({ message: error.message || "Server error" });
};

module.exports = { notFound, errorHandler };
