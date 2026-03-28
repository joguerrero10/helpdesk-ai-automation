import { Request, Response } from "express";
import whatsappService from "../integrations/whatsapp/whatsapp.service";

export const verifyWebhook = (req: Request, res: Response) => {
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export const receiveMessage = async (req: Request, res: Response) => {
  console.log("🔥 BODY:", JSON.stringify(req.body, null, 2));

  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      console.log("⚠️ No hay mensaje");
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body;

    console.log("📩 Mensaje:", text);

    await whatsappService.sendMessage(
      from,
      "✅ Recibido"
    );

    res.sendStatus(200);
  } catch (error: any) {
    res.sendStatus(500);
  }
};