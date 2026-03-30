import { prisma } from "../config/database";


export const getTenantByPhoneNumberId = async (phoneNumberId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { phoneNumberId },
  });

  if (!tenant) {
    throw new Error("Tenant no encontrado para este número de WhatsApp");
  }

  return tenant;
};

export const getTicketByCodeSecure = async (
  code: number,
  userPhone: string,
  phoneNumberId: string
) => {
  const tenant = await getTenantByPhoneNumberId(phoneNumberId);

  const user = await prisma.user.findUnique({
    where: { phone: userPhone },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      code,
      userId: user.id,
      tenantId: tenant.id,
    },
  });

  return ticket;
};