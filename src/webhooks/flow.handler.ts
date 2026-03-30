import {
  getTenantByPhoneNumberId,
  getTicketByCodeSecure,
} from "../services/tenant.service";
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

  const normalizedMsg = text?.toLowerCase().trim() || "";

  // 🔥 FORZAR ESTADO SI ES NULL
  let userState = getUserState(user);

  if (!userState || !userState.stage) {
    userState = { stage: "MENU" };
    setUserState(user, userState);
  }

  console.log("STATE:", userState);
  console.log("MSG:", normalizedMsg);

  // =========================
  // 🔥 COMANDOS GLOBALES (PRIORIDAD MÁXIMA)
  // =========================
  const GLOBAL_COMMANDS = ["menu", "hola", "inicio", "empezar"];

  if (GLOBAL_COMMANDS.includes(normalizedMsg)) {
    setUserState(user, { stage: "MENU" });

    return `
👋 ¡Hola! Soy Abby tu asistente virtual.

📌 *Opciones disponibles:*
1️⃣ Crear ticket  
2️⃣ Soporte humano  
3️⃣ Estado de ticket  
4️⃣ Enviar archivo  
5️⃣ Ayuda general  

Escribe el número 👇
`;
  }

  // =========================
  // 🔥 MENU PRINCIPAL
  // =========================
  if (userState.stage === "MENU") {

    if (["1", "crear", "crear ticket"].includes(normalizedMsg)) {
      setUserState(user, { stage: "CREAR_TICKET" });
      return "📝 Describe tu problema para crear el ticket";
    }

    if (["2", "soporte"].includes(normalizedMsg)) {
      const tenant = await getTenantByPhoneNumberId(phoneNumberId);
      const supportNumber = tenant.supportNumber;

      if (!supportNumber) {
        return "⚠️ No hay número de soporte configurado.";
      }

      const message = encodeURIComponent(
        `Hola, necesito soporte técnico. Mi número es ${user}`
      );

      return `👨‍💻 https://wa.me/${supportNumber}?text=${message}`;
    }

    if (["3", "estado", "ticket"].includes(normalizedMsg)) {
      setUserState(user, { stage: "CONSULTAR_TICKET" });

      return `
🔍 *Consulta de Ticket*

Envía el ID del ticket.

💡 Ejemplo: 12345

O escribe *menu* para volver.
`;
    }

    if (["4", "archivo"].includes(normalizedMsg)) {
      setUserState(user, { stage: "ENVIAR_ARCHIVO" });
      return "📎 Envíame el archivo";
    }

    if (["5", "ayuda"].includes(normalizedMsg)) {
      setUserState(user, { stage: "AYUDA_GENERAL" });

      return `
❓ *Ayuda General*

1️⃣ Crear ticket  
2️⃣ Estado de ticket  
3️⃣ Problemas comunes  
4️⃣ Soporte humano  

O escribe *menu* para volver.
`;
    }

    return "🤖 Escribe *menu* para comenzar.";
  }

  // =========================
  // 🔥 AYUDA GENERAL
  // =========================
  if (userState.stage === "AYUDA_GENERAL") {

    if (["1", "crear"].includes(normalizedMsg)) {
      setUserState(user, { stage: "CREAR_TICKET" });
      return "📝 Describe tu problema para crear el ticket";
    }

    if (
      normalizedMsg === "2" ||
      normalizedMsg.includes("estado") ||
      normalizedMsg.includes("ticket")
    ) {
      setUserState(user, { stage: "CONSULTAR_TICKET" });

      return `
🔍 *Consulta de Ticket*

Envía el ID del ticket.

💡 Ejemplo: 12345

O escribe *menu* para volver.
`;
    }

    if (normalizedMsg === "3") {
      return `
⚙️ *Problemas comunes*

🔹 No enciende el equipo  
🔹 Internet lento  
🔹 Error en sistema  
🔹 Pantalla azul  

👉 Describe tu problema y te ayudo.
`;
    }

    if (["4", "soporte"].includes(normalizedMsg)) {
      const tenant = await getTenantByPhoneNumberId(phoneNumberId);
      const supportNumber = tenant.supportNumber;

      if (!supportNumber) {
        return "⚠️ No hay número de soporte configurado.";
      }

      const message = encodeURIComponent(
        `Hola, necesito soporte técnico. Mi número es ${user}`
      );

      return `👨‍💻 https://wa.me/${supportNumber}?text=${message}`;
    }

    return `
❓ *Ayuda General*

1️⃣ Crear ticket  
2️⃣ Estado de ticket  
3️⃣ Problemas comunes  
4️⃣ Soporte humano  

O escribe *menu* para volver.
`;
  }

  // =========================
  // 🔥 CREAR TICKET
  // =========================
  if (userState.stage === "CREAR_TICKET") {

    if (!text || text.trim().length < 3) {
      return "📝 Describe mejor tu problema.";
    }

    const ticket = await createTicket(user, text, phoneNumberId);

    setUserState(user, {
      stage: "ENVIAR_ARCHIVO",
      ticketId: ticket.id,
    });

    return `
🎫 *Ticket creado*

🆔 ID: ${ticket.code}

Ahora puedes enviar un archivo 📎
O escribe *menu* para volver.
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

    const ticket = await getTicketByCodeSecure(code, user, phoneNumberId);

    if (!ticket) {
      return "❌ No tienes acceso a ese ticket.";
    }

    setUserState(user, { stage: "MENU" });

    return `
📄 *Ticket*

🆔 ${ticket.code}
📌 ${ticket.status}
📝 ${ticket.description}
`;
  }

  // =========================
  // 🔥 ENVIAR ARCHIVO
  // =========================
  if (userState.stage === "ENVIAR_ARCHIVO") {

    if (!media) {
      return "⚠️ Debes enviar un archivo.";
    }

    const tenant = await getTenantByPhoneNumberId(phoneNumberId);

    await addAttachmentToTicket(userState.ticketId!, tenant.id, media);

    setUserState(user, { stage: "MENU" });

    return `
📎 Archivo guardado correctamente

Se adjuntó a tu ticket 🎫
`;
  }

  return "🤖 No entendí tu mensaje. Escribe *menu*.";
};