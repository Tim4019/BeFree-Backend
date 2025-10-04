module.exports = (app) => {
  // 404 throw err 
  app.use((req, res, next) => {
    res.status(404).json({ message: "This route does not exist" });
  });

  // General error handler
  app.use((err, req, res, next) => {
    console.error("ERROR", err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(err.status || 500).json({
      error: err.message || "Server error",
    });
  });
};