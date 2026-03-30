import {
  getUserState,
  setUserState,
} from "../state/userState";

import {
  getTenantByPhoneNumberId,
  getTicketByCodeSecure,
} from "../services/tenant.service";

import {
  addAttachmentToTicket,
  createTicket,
} from "../services/ticket.service";

export const handleFlows = async (
  text: string,
  user: string,
  phoneNumberId: string,
  media?: any
) => {

  if (!text && !media) {
    return "⚠️ No recibí ningún mensaje.";
  }

  const normalizedMsg = text?.toLowerCase().trim() || "";

  let userState = await getUserState(user);

  if (!userState) {
    userState = { stage: "MENU" };
    await setUserState(user, userState);
  }

  console.log("STATE:", userState);
  console.log("MSG:", normalizedMsg);

  // =========================
  // 🔥 COMANDOS GLOBALES
  // =========================
  const GLOBAL_COMMANDS = ["menu", "hola", "inicio", "empezar"];

  // Si escribe un comando global → siempre reinicia el menú
  if (GLOBAL_COMMANDS.includes(normalizedMsg)) {
    await setUserState(user, { stage: "MENU" });

    return `
👋 ¡Hola! Soy Abby tu asistente virtual.

📌 *Opciones disponibles:*
1️⃣ Crear ticket  
2️⃣ Soporte humano  
3️⃣ Estado de ticket  
4️⃣ Enviar archivo  
5️⃣ Ayuda  

Escribe el número 👇
`;
  }

  // =========================
  // 🔥 MENU PRINCIPAL (CORREGIDO)
  // =========================
  if (userState.stage === "MENU") {

    if (["1", "crear", "ticket"].includes(normalizedMsg)) {
      await setUserState(user, { stage: "CREAR_TICKET" });
      return "📝 Describe tu problema para crear el ticket";
    }

    if (["2", "soporte"].includes(normalizedMsg)) {
      const tenant = await getTenantByPhoneNumberId(phoneNumberId);

      if (!tenant?.supportNumber) {
        return "⚠️ No hay soporte configurado.";
      }

      const msg = encodeURIComponent(
        `Hola, necesito soporte. Usuario: ${user}`
      );

      return `👨‍💻 https://wa.me/${tenant.supportNumber}?text=${msg}`;
    }

    if (["3", "estado"].includes(normalizedMsg)) {
      await setUserState(user, { stage: "CONSULTAR_TICKET" });
      return "🔍 Envíame el ID del ticket";
    }

    if (["4", "archivo"].includes(normalizedMsg)) {
      await setUserState(user, { stage: "ENVIAR_ARCHIVO" });
      return "📎 Envíame el archivo";
    }

    if (["5", "ayuda"].includes(normalizedMsg)) {
      return `
❓ *Ayuda*

1️⃣ Crear ticket  
2️⃣ Estado  
3️⃣ Problemas comunes  
4️⃣ Soporte humano  
`;
    }

    // ❌ Si no coincide con ninguna opción del menú
    return `
❌ *Palabra inválida*

Por favor escribe: *menu*, *hola*, *inicio* o *empezar* para ver el menú.
`;
  }

  // =========================
  // 🔥 CREAR TICKET
  // =========================
  if (userState.stage === "CREAR_TICKET") {

    if (!text || text.trim().length < 2) {
      return "📝 Por favor escribe una descripción breve del problema.";
    }

    const ticket = await createTicket(user, text.trim(), phoneNumberId);

    await setUserState(user, {
      stage: "ENVIAR_ARCHIVO",
      ticketId: ticket.id,
    });

    return `
🎫 Ticket creado correctamente

🆔 *ID:* ${ticket.code}
📝 *Descripción:* ${text.trim()}

Puedes enviar un archivo 📎  
O escribe *menu* para volver al menú principal.
`;
  }

  // =========================
  // 🔥 CONSULTAR TICKET
  // =========================
  if (userState.stage === "CONSULTAR_TICKET") {

    const code = parseInt(normalizedMsg);

    if (isNaN(code)) {
      return "⚠️ Envía un ID válido.";
    }

    const ticket = await getTicketByCodeSecure(
      code,
      user,
      phoneNumberId
    );

    await setUserState(user, { stage: "MENU" });

    if (!ticket) {
      return "❌ No encontrado o sin acceso.";
    }

    return `
📄 *Ticket*

🆔 ${ticket.code}
📌 Estado: ${ticket.status}
📝 ${ticket.description}
`;
  }

  if (userState.stage === "ENVIAR_ARCHIVO") {

    if (!media) {
      return "⚠️ Envía un archivo.";
    }

    const tenant = await getTenantByPhoneNumberId(phoneNumberId);

    await addAttachmentToTicket(
      userState.ticketId,
      tenant.id,
      media
    );

    await setUserState(user, { stage: "MENU" });

    return `
📎 Archivo recibido y guardado correctamente.

Se adjuntó a tu ticket 🎫  
Escribe *menu* para volver al inicio.
`;
  }

  return "🤖 Escribe *menu* para comenzar.";
};