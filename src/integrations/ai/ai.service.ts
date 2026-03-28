import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  async getResponse(message: string): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un técnico experto en soporte IT. Responde claro, profesional y breve.",
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