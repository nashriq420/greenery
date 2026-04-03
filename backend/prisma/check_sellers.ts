import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sellers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "seller1@greenery.com",
          "seller2@greenery.com",
          "seller3@greenery.com",
          "seller4@greenery.com",
        ],
      },
    },
  });

  console.log("Found sellers:", sellers.map(s => s.email));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
