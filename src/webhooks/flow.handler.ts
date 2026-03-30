import { createTicket } from "../services/ticket.service";
import { getUserState, setUserState } from "../state/userState";

export const handleFlows = async (text: string, user: string) => {
  if (!text) return "⚠️ No recibí ningún mensaje. Escribe *menu* para comenzar.";

  const msg = text.toLowerCase().trim();
  const userState = getUserState(user);

  // ===== MENU PRINCIPAL =====
  const triggers = ["hola", "menu", "inicio", "empezar"];
  if (triggers.includes(msg)) {
    setUserState(user, "MENU");
    return `
👋 ¡Hola! Soy Abby tu asistente virtual.

📌 *Opciones disponibles:*
1️⃣ Crear un ticket  
2️⃣ Hablar con soporte humano  
3️⃣ Estado de mi ticket  
4️⃣ Enviar archivo  
5️⃣ Ayuda general

Escribe el número de la opción. 😊
`;
  }

  // ===== OPCIÓN 1: CREAR TICKET =====
  if (userState.stage === "MENU" && msg === "1") {
    setUserState(user, "CREAR_TICKET");

    return `
📝 Perfecto, vamos a crear un ticket.

Por favor descríbeme el problema que estás teniendo con tu PC.  
Entre más detalles, mejor podré ayudarte. 😊
`;
  }

  // ===== RECOGER DESCRIPCIÓN DEL TICKET =====
  if (userState.stage === "CREAR_TICKET") {
    setUserState(user, null);

    const descripcion = text;

    const ticket = await createTicket(user, descripcion);

    return `
🎫 *Ticket creado exitosamente*

🆔 ID: *${ticket.code}*  
📝 Descripción: ${descripcion}

Un agente revisará tu caso pronto.  
¡Gracias por tu paciencia! 🙌
`;
  }

  // Respuesta por defecto (NUNCA null)
  return "🤖 No entendí tu mensaje. Escribe *menu* para ver las opciones disponibles.";
};