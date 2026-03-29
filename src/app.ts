import express, { Request, Response } from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import routes from "./routes";
import { receiveMessage, verifyWebhook } from "./webhooks/whatsapp.webhook";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_: Request, res: Response) => {
  res.send("🚀 Chatbot API funcionando");
});

// 🔹 Webhook
app.get("/webhook", verifyWebhook);
app.post("/webhook", receiveMessage);

app.use("/api/v1", routes);


app.use(notFoundMiddleware);
app.use(errorMiddleware);



export default app;