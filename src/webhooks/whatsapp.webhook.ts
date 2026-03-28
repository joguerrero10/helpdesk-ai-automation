import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import aiService from "../integrations/ai/ai.service";
import whatsappService from "../integrations/whatsapp/whatsapp.service";

const prisma = new PrismaClient();

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
    const value = req.body.entry?.[0]?.changes?.[0]?.value;

    const message = value?.messages?.[0];
    const phoneNumberId = value?.metadata?.phone_number_id;

    if (message) {
      const from = message.from;
      const text = message.text?.body;

      console.log("📩 Mensaje:", text);

      // 🔹 1. Buscar tenant
      const tenant = await prisma.tenant.findUnique({
        where: { phoneNumberId }
      });

      if (!tenant) {
        console.log("❌ Tenant no encontrado");
        return res.sendStatus(200);
      }

      // 🔹 2. Obtener bot
      const bot = await prisma.bot.findFirst({
        where: { tenantId: tenant.id }
      });

      // 🔹 3. IA personalizada
      const aiResponse = await aiService.generateResponse(
        text || "",
        bot?.prompt || "Eres un asistente técnico"
      );

      // 🔹 4. Responder WhatsApp
      await whatsappService.sendMessage(from, aiResponse);

      // 🔹 5. Guardar conversación
      await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          userPhone: from,
          message: text || "",
          response: aiResponse
        }
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.sendStatus(500);
  }
};