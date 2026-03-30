import { getTenantByPhoneNumberId, getTicketByCodeSecure } from "../services/tenant.service";
import {
  addAttachmentToTicket,
  createTicket,
} from "../services/ticket.service";
import { getUserState, setUserState } from "../state/userState";

export const handleFlows = async (
  text: string,
  user: string,
  phoneNumberId: string,
  media?: any
) => {
  if (!text && !media) {
    return "⚠️ No recibí ningún mensaje. Escribe *menu* para comenzar.";
  }

  const msg = text?.toLowerCase().trim() || "";
  const userState = getUserState(user);

  console.log("STATE:", userState);
  console.log("MSG:", msg);
  console.log("MEDIA:", media);

  // ===== MENU =====
  if (["hola", "menu", "inicio", "empezar"].includes(msg)) {
    setUserState(user, { stage: "MENU" });

    return `
👋 ¡Hola! Soy Abby tu asistente virtual.

📌 *Opciones disponibles:*
1️⃣ Crear un ticket sin archivo adjunto
2️⃣ Hablar con soporte humano  
3️⃣ Estado de mi ticket  
4️⃣ Enviar archivo + Crear un ticket  
5️⃣ Ayuda general

Escribe el número de la opción. 😊
`;
  }

  // ===== OPCIÓN 1 =====
  if (msg === "1") {
    setUserState(user, { stage: "CREAR_TICKET" });

    return `
📝 Perfecto, vamos a crear un ticket.

Por favor descríbeme el problema que estás teniendo con tu PC.
`;
  }

  // ===== CREAR TICKET =====
  if (userState?.stage === "CREAR_TICKET") {
    const descripcion = text;

    const ticket = await createTicket(user, descripcion, phoneNumberId);

    // 👇 ahora guardamos ticketId para archivo
    setUserState(user, {
      stage: "ENVIAR_ARCHIVO",
      ticketId: ticket.id,
    });

    return `
🎫 *Ticket creado*

🆔 ID: ${ticket.code}

Ahora puedes enviar un archivo si lo deseas 📎
O escribe *menu* para volver.
`;
  }

  // ===== OPCIÓN 2 =====
  if (msg === "2") {
    setUserState(user, null);

    const tenant = await getTenantByPhoneNumberId(phoneNumberId);
    const supportNumber = tenant.supportNumber;

    if (!supportNumber) {
      return "⚠️ No hay número de soporte configurado.";
    }

    const message = encodeURIComponent(
      `Hola, necesito soporte técnico. Mi número es ${user}`
    );

    const link = `https://wa.me/${supportNumber}?text=${message}`;

    return `
👨‍💻 *Soporte humano*

👉 ${link}
`;
  }

  // ===== OPCIÓN 3 =====
  if (msg === "3") {
    setUserState(user, { stage: "CONSULTAR_TICKET" });

    return "🔍 Envíame el ID del ticket";
  }

  // ===== CONSULTAR =====
  if (userState?.stage === "CONSULTAR_TICKET") {
    setUserState(user, null);

    const code = parseInt(text);

    if (isNaN(code)) {
      return "⚠️ ID inválido";
    }

    const ticket = await getTicketByCodeSecure(
      code,
      user,
      phoneNumberId
    );

    if (!ticket) {
      return "❌ No tienes acceso a ese ticket";
    }

    return `
📄 Ticket

🆔 ${ticket.code}
📌 ${ticket.status}
📝 ${ticket.description}
`;
  }

  // ===== OPCIÓN 4 =====
  if (msg === "4") {
    setUserState(user, { stage: "ENVIAR_ARCHIVO" });

    return "📎 Envíame el archivo";
  }

  // ===== GUARDAR ARCHIVO =====
  if (userState?.stage === "ENVIAR_ARCHIVO") {
    if (!media) {
      return "⚠️ Debes enviar un archivo.";
    }

    const ticketId = userState.ticketId;

    if (!ticketId) {
      setUserState(user, { stage: "CREAR_TICKET_DESDE_ARCHIVO", media });

      return `
📎 Recibí tu archivo

Para poder ayudarte necesito que me describas el problema.

Escribe qué sucede con tu equipo 💻
`;
    }
    const tenant = await getTenantByPhoneNumberId(phoneNumberId);

    await addAttachmentToTicket(
      ticketId,
      tenant.id,
      userState.media
    );
    setUserState(user, null);

    return `
📎 Archivo guardado correctamente

Se adjuntó a tu ticket 🎫
`;
  }
  // ===== CREAR TICKET DESDE ARCHIVO =====
  if (userState?.stage === "CREAR_TICKET_DESDE_ARCHIVO") {
    const descripcion = text;

    const ticket = await createTicket(user, descripcion, phoneNumberId);

    // 🔥 usamos el media guardado
    await addAttachmentToTicket(ticket.id, phoneNumberId, userState.media);

    setUserState(user, null);

    return `
🎫 Ticket creado con archivo adjunto

🆔 ID: ${ticket.code}

Un agente revisará tu caso 🙌
`;
  }

  // ===== OPCIÓN 5 =====
  if (msg === "5") {
    return `
❓ *Ayuda*

1 → Crear ticket  
2 → Soporte humano  
3 → Ver ticket  
4 → Enviar archivo
`;
  }

  return "🤖 No entendí tu mensaje. Escribe *menu*.";
};