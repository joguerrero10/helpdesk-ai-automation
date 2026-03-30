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