import { prisma } from "../config/database";
import { getTenantByPhoneNumberId } from "./tenant.service";

export const createTicket = async (
  userPhone: string,
  descripcion: string,
  phoneNumberId: string
) => {
  const tenant = await getTenantByPhoneNumberId(phoneNumberId);

  let user = await prisma.user.findUnique({
    where: { phone: userPhone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: userPhone,
        tenantId: tenant.id,
      },
    });
  }

  const ticket = await prisma.ticket.create({
    data: {
      code: Math.floor(Math.random() * 90000 + 10000),
      description: descripcion,
      userId: user.id,
      tenantId: tenant.id,
    },
  });

  return ticket;
};

export const addAttachmentToTicket = async (
  ticketId: string,
  tenantId: string,
  media: any
) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  return await prisma.attachment.create({
    data: {
      type: media.type,
      fileId: media.id,
      mimeType: media.mime_type,
      fileName: media.filename || null,

      ticket: {
        connect: { id: ticketId },
      },

      tenant: {
        connect: { id: ticket.tenantId },
      },
    },
  });
};