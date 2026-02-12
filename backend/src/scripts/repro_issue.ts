
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Repro Issue ---');

    // Case 1: Simulate "unchecked" checkbox sending deliveryAvailable=false
    const uncheckedCount = await prisma.listing.count({
        where: {
            active: true,
            status: 'ACTIVE',
            deliveryAvailable: false
        }
    });
    console.log(`Query (deliveryAvailable: false): Found ${uncheckedCount} listings (Matches User Issue if == 2)`);

    // Case 2: Simulate intended behavior "unchecked" -> show all
    const allCount = await prisma.listing.count({
        where: {
            active: true,
            status: 'ACTIVE'
        }
    });
    console.log(`Query (deliveryAvailable: ignored): Found ${allCount} listings (Expected)`);

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
