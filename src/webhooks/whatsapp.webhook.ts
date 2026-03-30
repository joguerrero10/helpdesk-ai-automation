import { Request, Response } from "express";
import { logEvent } from "../config/logger";
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
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    const rawText = message.text?.body?.trim() || "";
    const text = rawText.toLowerCase();

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

    logEvent("MENSAJE_RECIBIDO", {
      user: from,
      message: text || "[MEDIA]",
      media,
    });

    const phoneNumberId =
      req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    const devPhoneNumberId = "test-1";

    const flowResponse = await handleFlows(
      text,
      from,
      phoneNumberId || devPhoneNumberId,
      media
    );

    if (flowResponse) {
      await whatsappService.sendWhatsAppMessage(from, flowResponse);

      logEvent("RESPUESTA_ENVIADA", { reply: flowResponse });

      return res.sendStatus(200);
    }

    // Si quieres IA solo cuando NO hay flujo activo
    if (rawText && !flowResponse) {
      // Aquí podrías conectar IA si quieres
      // const aiResponse = await aiService.generateResponse(from, rawText);

      // await whatsappService.sendWhatsAppMessage(from, aiResponse);

      // logEvent("RESPUESTA_ENVIADA", { reply: aiResponse });
    }

    return res.sendStatus(200);
  } catch (error: any) {
    console.error("❌ ERROR:", error);

    logEvent("ERROR_WEBHOOK", { error: error.message });

    return res.sendStatus(500);
  }
};