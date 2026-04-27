import { prisma } from './src/utils/prisma';

async function main() {
  try {
    console.log("Running query...");
    const reports = await prisma.blacklistReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { name: true, email: true } },
        _count: { select: { confirmations: true } },
      },
    });
    console.log("Success! Found", reports.length, "reports");
    console.log(JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error("Error executing query:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
