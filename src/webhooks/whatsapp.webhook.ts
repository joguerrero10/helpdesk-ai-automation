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

    // Si no hay mensaje → ignorar
    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    // 🔹 TEXTO
    let text = "";
    if (message.text?.body) {
      text = message.text.body.trim().toLowerCase();
    }

    // 🔹 ARCHIVOS (imagen o documento)
    let media: any = null;

    if (message.image) {
      media = {
        type: "image",
        id: message.image.id,
        mime_type: message.image.mime_type,
      };
    }

    if (message.document) {
      media = {
        type: "document",
        id: message.document.id,
        filename: message.document.filename,
        mime_type: message.document.mime_type,
      };
    }

    // Log de entrada
    logEvent("MENSAJE_RECIBIDO", {
      user: from,
      message: text || "[MEDIA]",
      media,
    });

    console.log("📩 Mensaje recibido:", text || "MEDIA");

    // 🔗 Obtener phoneNumberId (multi-tenant)
    const phoneNumberId =
      req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    const devPhoneNumberId = "test-1"; // 👈 fallback en desarrollo

    // 🔥 FLOW (ahora con media)
    const flowResponse = await handleFlows(
      text,
      from,
      phoneNumberId || devPhoneNumberId,
      media
    );

    if (flowResponse && typeof flowResponse === "string") {
      await whatsappService.sendWhatsAppMessage(from, flowResponse);

      logEvent("RESPUESTA_ENVIADA", { reply: flowResponse });

      return res.sendStatus(200);
    }

    // 🤖 IA SOLO SI HAY TEXTO
    if (text) {
      const aiResponse = await aiService.generateResponse(from, text);

      await whatsappService.sendWhatsAppMessage(from, aiResponse);

      logEvent("RESPUESTA_ENVIADA", { reply: aiResponse });
    }

    return res.sendStatus(200);
  } catch (error: any) {
    console.error("❌ ERROR:", error);

    logEvent("ERROR_IA", { error: error.message });

    return res.sendStatus(500);
  }
};