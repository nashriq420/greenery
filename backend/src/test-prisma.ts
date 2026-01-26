import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Prisma Client...');
    if (prisma.post) {
        console.log('✅ prisma.post exists');
    } else {
        console.error('❌ prisma.post is undefined');
    }

    if (prisma.auditLog) {
        console.log('✅ prisma.auditLog exists');
    } else {
        console.error('❌ prisma.auditLog is undefined');
    }

    try {
        const count = await prisma.post.count();
        console.log('Post count:', count);
    } catch (e) {
        console.error('Error connecting to DB:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
