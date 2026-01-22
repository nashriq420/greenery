import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debug Auth Script ---');
    const email = 'admin@greenery.com';
    const password = 'admin123';

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`[FAIL] User ${email} does NOT exist.`);
            return;
        }

        console.log(`[OK] User ${email} exists.`);
        console.log(`User ID: ${user.id}`);
        console.log(`User Role: ${user.role}`);
        console.log(`User Status: ${user.status}`);
        console.log(`Stored Hash: ${user.password}`);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`[TEST] bcrypt.compare('admin123', storedHash) = ${isMatch}`);

        if (isMatch) {
            console.log('[SUCCESS] Password matches.');
        } else {
            console.log('[FAIL] Password does NOT match.');
            // Generate new hash to see what it should look like
            const newHash = await bcrypt.hash(password, 10);
            console.log(`Expected Hash Example: ${newHash}`);
        }

    } catch (e) {
        console.error('Error running debug script:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
