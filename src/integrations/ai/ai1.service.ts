import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  async generateResponse(message: string): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un experto agente de soporte técnico especializado en resolver problemas relacionados con software y hardware. Proporciona respuestas claras, concisas y útiles para ayudar a los usuarios a solucionar sus problemas técnicos de manera eficiente.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return completion.choices[0].message.content || "No entendí tu mensaje";
  }
}

export default new AIService();