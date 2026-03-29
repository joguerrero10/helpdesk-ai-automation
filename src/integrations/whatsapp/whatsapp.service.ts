import axios from "axios";

class WhatsAppService {
  async sendWhatsAppMessage(to: string, message: string) {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to,
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      console.error("❌ Error enviando mensaje:", error.response?.data || error);
    }
  }
}

export default new WhatsAppService();