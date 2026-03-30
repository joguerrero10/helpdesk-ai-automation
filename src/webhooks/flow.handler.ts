import { getTicketByCodeSecure } from "../services/tenant.service";
import { createTicket } from "../services/ticket.service";
import { getUserState, setUserState } from "../state/userState";

export const handleFlows = async (
  text: string,
  user: string,
  phoneNumberId: string
) => {
  if (!text) {
    return "⚠️ No recibí ningún mensaje. Escribe *menu* para comenzar.";
  }

  const msg = text.toLowerCase().trim();
  const userState = getUserState(user);

  // DEBUG (puedes quitar luego)
  console.log("STATE:", userState.stage);
  console.log("MSG:", msg);

  // ===== COMANDO GLOBAL MENU =====
  if (["hola", "menu", "inicio", "empezar"].includes(msg)) {
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
  if (msg === "1") {
    setUserState(user, "CREAR_TICKET");

    return `
📝 Perfecto, vamos a crear un ticket.

Por favor descríbeme el problema que estás teniendo con tu PC.  
Entre más detalles, mejor podré ayudarte. 😊
`;
  }

  // ===== GUARDAR TICKET =====
  if (userState.stage === "CREAR_TICKET") {
    setUserState(user, null);

    const descripcion = text;

    const ticket = await createTicket(user, descripcion, phoneNumberId);

    return `
🎫 *Ticket creado exitosamente*

🆔 ID: *${ticket.code}*  
📝 Descripción: ${descripcion}

Un agente revisará tu caso pronto.  
¡Gracias por tu paciencia! 🙌
`;
  }

  // ===== OPCIÓN 3: CONSULTAR TICKET =====
  if (msg === "3") {
    setUserState(user, "CONSULTAR_TICKET");

    return `
🔍 Consulta de ticket

Por favor envíame el ID del ticket que deseas consultar.
`;
  }

  // ===== BUSCAR TICKET =====
  if (userState.stage === "CONSULTAR_TICKET") {
    setUserState(user, null);

    const code = parseInt(text);

    if (isNaN(code)) {
      return "⚠️ El ID debe ser un número válido.";
    }

    const ticket = await getTicketByCodeSecure(
      code,
      user,
      phoneNumberId
    );

    if (!ticket) {
      return "❌ No encontré ese ticket o no tienes acceso a él.";
    }

    return `
📄 *Estado del Ticket*

🆔 ID: *${ticket.code}*
📌 Estado: *${ticket.status}*
📝 Descripción: ${ticket.description}
`;
  }

  // ===== RESPUESTA POR DEFECTO =====
  return "🤖 No entendí tu mensaje. Escribe *menu* para ver las opciones disponibles.";
};