import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const PORT = Number(env.PORT);


app.listen(PORT, () => {
  logger.info(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores globales
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", reason);
});