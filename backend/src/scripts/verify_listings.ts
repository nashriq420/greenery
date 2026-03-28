import { prisma } from '../utils/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const count = await prisma.listing.count({
        where: {
            seller: {
                email: 'seller@greenery.com'
            }
        }
    });
    console.log(`Total listings for seller@greenery.com: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
