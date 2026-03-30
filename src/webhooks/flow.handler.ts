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

  const GLOBAL_COMMANDS = ["menu", "hola", "inicio", "empezar"];

  if (GLOBAL_COMMANDS.includes(normalizedMsg)) {
    await setUserState(user, { stage: "MENU" });

    return `
👋 ¡Hola! Soy Abby tu asistente virtual.

📌 *Opciones disponibles:*
1️⃣ Crear ticket  
2️⃣ Soporte humano  
3️⃣ Estado de ticket  
4️⃣ Ayuda   

Escribe el número 👇
`;
  }

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

      return (
        "👨‍💻 *Conectándote con Soporte Humano*\n\n" +
        "Estamos enviando tu caso a uno de nuestros agentes reales.\n\n" +
        "📌 *¿Qué puedes esperar ahora?*\n" +
        "• Un agente te responderá personalmente\n" +
        "• Podrás explicar tu caso en detalle\n" +
        "• Si es necesario, podrán hacer una videollamada o pedir más información\n\n" +
        "👉 Haz clic en este enlace para continuar:\n" +
        `👨‍💻 https://wa.me/${tenant.supportNumber}\n\n` +
        "📞 *Horario de atención:* 8:00 AM – 6:00 PM"
      );
    }

    if (["3", "estado"].includes(normalizedMsg)) {
      await setUserState(user, { stage: "CONSULTAR_TICKET" });
      return "🔍 Envíame el ID del ticket";
    }

    if (["4", "ayuda"].includes(normalizedMsg)) {
      await setUserState(user, { stage: "AYUDA" });

      return `
📘 *Centro de Ayuda – Aprende a usar Abby*

Selecciona una categoría para aprender:

1️⃣ ¿Cómo crear un ticket?  
2️⃣ ¿Qué hace Soporte Humano?  
3️⃣ ¿Cómo consultar el estado de un ticket?  
4️⃣ Volver al menú principal

Escribe un número 👇
`;
    }

    return `
❌ *Opción inválida*

Por favor escribe: *menu*, *hola*, *inicio* o *empezar* para ver el menú.
`;
  }

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

  if (userState.stage === "AYUDA") {

    if (normalizedMsg === "1") {
      return `
📝 *¿Cómo crear un ticket?*

Un ticket es un reporte de un problema o solicitud.

🔹 Pasos:
1. Escribe *1* en el menú principal  
2. Describe tu problema  
3. Opcional: envía un archivo  
Puedes enviar imágenes, PDFs o capturas.
Sirve para que soporte entienda mejor el problema.

Ejemplo:  
"Mi impresora no imprime desde ayer."

Ejemplo:  
"Adjunto captura del error."

✏️ Escribe *menu* para regresar.
`;
    }

    if (normalizedMsg === "2") {
      return `
👨‍💻 *¿Qué es Soporte Humano?*

Es acceso directo a un agente real.

🔹 Úsalo cuando:
- El bot no responde lo que necesitas  
- Tu caso es urgente  
- Requieres asistencia personalizada  

Abby enviará un enlace directo a WhatsApp.

✏️ Escribe *menu* para regresar.
`;
    }

    if (normalizedMsg === "3") {
      return `
📊 *Consultar el estado de un ticket*

Te permite saber si está:
📥 Recibido  
🛠️ En proceso  
✅ Resuelto  

🔹 Cómo usarlo:
1. Escribe *3*  
2. Envía el ID del ticket  

✏️ Escribe *menu* para regresar.
`;
    }

    if (normalizedMsg === "4") {
      await setUserState(user, { stage: "MENU" });
      return "📋 Volviendo al menú principal...\n\nEscribe *menu* si no aparece.";
    }

    return `
❌ Opción inválida en la ayuda.

Escribe un número del *1 al 4*.  
O escribe *menu* para regresar.
`;
  }

  return "🤖 Escribe *menu* para comenzar.";
};