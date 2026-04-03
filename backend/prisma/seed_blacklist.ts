import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/greenery?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const reporters = [
  "customer@greenery.com",
  "customer2@greenery.com",
  "customer3@greenery.com",
];

const reportData = [
  { username: "scammer_99", region: "Thailand", contact: "@scam99", desc: "Took money via crypto and blocked me." },
  { username: "fake_buds", region: "Germany", contact: "+49 123 4567", desc: "Sent brown leaves instead of high-grade flower." },
  { username: "plug_zero", region: "UK", contact: "plugzero@mail.com", desc: "Ghosted after receiving payment for a bulk order." },
  { username: "green_bandit", region: "US", contact: "@greenbandit", desc: "Inconsistent weights, always short by 2-3 grams." },
  { username: "weed_thief", region: "Canada", contact: "weedthief@protonmail.com", desc: "Exit scammed during the holiday season." },
];

async function main() {
  console.log("Starting blacklist report seed...");

  const password = await bcrypt.hash("GreenPass123!", 10);

  // Ensure all reporters exist
  console.log("Ensuring reporters exist...");
  for (const email of reporters) {
    const username = email.split("@")[0];
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        username,
        name: `${username.charAt(0).toUpperCase() + username.slice(1)}`,
        password,
        role: "CUSTOMER",
        status: "ACTIVE",
        isVerified: true,
      },
    });
  }

  const userEmails = await prisma.user.findMany({
    where: { email: { in: reporters } },
    select: { id: true, email: true },
  });

  const reporterMap = new Map(userEmails.map((u) => [u.email, u.id]));

  for (let i = 0; i < 30; i++) {
    const reporterIndex = i % reporters.length;
    const reporterEmail = reporters[reporterIndex];
    const reporterId = reporterMap.get(reporterEmail);
    
    if (!reporterId) continue;

    const dataIndex = i % reportData.length;
    const item = reportData[dataIndex];

    const statuses = ["PENDING", "APPROVED", "REJECTED"];
    const status = statuses[i % statuses.length];

    await prisma.blacklistReport.create({
      data: {
        reporterId,
        username: `${item.username}_${i}`,
        region: item.region,
        contactInfo: item.contact,
        description: `${item.desc} This has been happening repeatedly.`,
        evidenceUrl: "https://example.com/evidence/scam_proof.jpg",
        status: status as any,
        adminComment: status === "APPROVED" ? "Scam verified by multiple reports." : null,
      },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`Created ${i + 1} reports...`);
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
