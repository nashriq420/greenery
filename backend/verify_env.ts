import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

console.log("Checking environment...");

if (!process.env.JWT_SECRET) {
    console.error("FAIL: JWT_SECRET is missing!");
} else {
    console.log("PASS: JWT_SECRET is present.");
}

if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is missing!");
} else {
    console.log("PASS: DATABASE_URL is present.");
}

const prisma = new PrismaClient();
async function checkDb() {
    try {
        await prisma.$connect();
        console.log("PASS: Database connection successful.");
    } catch (e) {
        console.error("FAIL: Database connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();
