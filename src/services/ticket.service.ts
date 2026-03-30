import { prisma } from "../config/database";

export const createTicket = async (userPhone: string, descripcion: string) => {
  // 1. Buscar usuario
  let user = await prisma.user.findUnique({
    where: { phone: userPhone },
  });

  // 2. Si no existe → crear
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: userPhone,
        tenantId: "fb227c19-c270-4cdb-a4cc-5232a70a93d6",
      },
    });
  }

  // 3. Crear ticket
  const ticket = await prisma.ticket.create({
    data: {
      code: Math.floor(Math.random() * 90000 + 10000),
      description: descripcion,
      userId: user.id,
      tenantId: user.tenantId,
    },
  });

  return ticket;
};