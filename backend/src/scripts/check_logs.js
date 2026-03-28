const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("Most recent logs:");
    logs.forEach((log) => {
      console.log(`Action: ${log.action}`);
      console.log(`User Relation:`, log.user);
      console.log(`Details: ${log.details}`);
      console.log("---");
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogs();
