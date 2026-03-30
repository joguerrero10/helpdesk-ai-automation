import Groq from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import sessionService from "../../services/session.service";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class AIService {
  async generateResponse(userId: string, message: string): Promise<string> {
    const session = sessionService.getSession(userId);

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Eres Abby, una asistente de soporte técnico amigable, clara y humana.
                  - Respondes con tono cálido y profesional.
                  - Puedes usar emojis cuando sea natural.
                  - Mantienes contexto de la conversación.
                  - Puedes pedir aclaraciones si el usuario no es claro.
                  - Prioriza soluciones prácticas y paso a paso.`,
      },
      ...(session.history as ChatCompletionMessageParam[]),
      { role: "user", content: message },
    ];

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.6,
      max_tokens: 300,
    });

    const reply = completion.choices[0].message.content || "No pude procesar tu solicitud";

    sessionService.updateSession(userId, "user", message);
    sessionService.updateSession(userId, "assistant", reply);

    return reply;
  }
}

export default new AIService();