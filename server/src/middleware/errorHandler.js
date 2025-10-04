export function notFound(req, res, next) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error("Unhandled error", err);
  const status = err.status || (err.code === "EMAIL_IN_USE" ? 409 : 500);
  const message =
    err.publicMessage ||
    (err.code === "EMAIL_IN_USE"
      ? "Email address already in use"
      : err.code === "INVALID_CREDENTIALS"
      ? "Invalid credentials"
      : "Something went wrong");

  res.status(status).json({ error: message });
}
