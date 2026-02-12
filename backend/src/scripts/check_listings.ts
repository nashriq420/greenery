
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const allListingsCount = await prisma.listing.count();
    const activeActiveListings = await prisma.listing.count({
        where: { active: true, status: 'ACTIVE' }
    });

    const listings = await prisma.listing.findMany({
        take: 20,
        select: {
            id: true,
            title: true,
            active: true,
            status: true,
            deliveryAvailable: true,
            sellerId: true,
            seller: {
                select: {
                    name: true,
                    sellerProfile: {
                        select: {
                            latitude: true,
                            longitude: true
                        }
                    }
                }
            }
        }
    });

    const output = {
        total: allListingsCount,
        active: activeActiveListings,
        sample: listings
    };

    fs.writeFileSync(path.join(__dirname, '..', '..', 'listings_dump.json'), JSON.stringify(output, null, 2));
    console.log('Dumped to listings_dump.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
