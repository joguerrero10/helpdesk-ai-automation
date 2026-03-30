import { Request, Response } from "express";
import { logEvent } from "../config/logger";
import aiService from "../integrations/ai/ai.service";
import whatsappService from "../integrations/whatsapp/whatsapp.service";
import { handleFlows } from "./flow.handler";

export const verifyWebhook = (req: Request, res: Response) => {
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export const receiveMessage = async (req: Request, res: Response) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || !message.text?.body) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text.body.trim().toLowerCase();

    logEvent("MENSAJE_RECIBIDO", { user: from, message: text });
    console.log("📩 Mensaje recibido:", text);

    const phoneNumberId =
      req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    const flowResponse = await handleFlows(text, from, phoneNumberId);

    if (flowResponse && typeof flowResponse === "string") {
      await whatsappService.sendWhatsAppMessage(from, flowResponse);

      logEvent("RESPUESTA_ENVIADA", { reply: flowResponse });

      return res.sendStatus(200);
    }

    const aiResponse = await aiService.generateResponse(from, text);

    await whatsappService.sendWhatsAppMessage(from, aiResponse);

    logEvent("RESPUESTA_ENVIADA", { reply: aiResponse });

    return res.sendStatus(200);
  } catch (error: any) {
    console.error("❌ ERROR:", error);

    logEvent("ERROR_IA", { error: error.message });

    return res.sendStatus(500);
  }
};