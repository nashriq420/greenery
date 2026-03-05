import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'seller@greenery.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error(`User ${email} not found! Please register the user first.`);
        process.exit(1);
    }

    console.log(`Found user: ${user.id} (${user.email}). Setting up Premium Subscription...`);

    const existingSub = await prisma.subscription.findUnique({ where: { userId: user.id } });

    if (existingSub) {
        await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
                autoRenew: true
            }
        });
        console.log("Updated existing subscription to ACTIVE.");
    } else {
        await prisma.subscription.create({
            data: {
                userId: user.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                autoRenew: true
            }
        });
        console.log("Created new ACTIVE subscription.");
    }

    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
