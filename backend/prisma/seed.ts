import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/greenery?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });


async function main() {
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@greenery.com' },
        update: {},
        create: {
            email: 'admin@greenery.com',
            username: 'admin',
            name: 'Admin User',
            password,
            role: 'ADMIN',
            status: 'ACTIVE',
            isVerified: true
        },
    });

    console.log({ admin });

    const customer = await prisma.user.upsert({
        where: { email: 'customer@greenery.com' },
        update: {},
        create: {
            email: 'customer@greenery.com',
            username: 'customer',
            name: 'John Customer',
            password: await bcrypt.hash('customer123', 10),
            role: 'CUSTOMER',
            status: 'ACTIVE',
            isVerified: true
        },
    });
    console.log({ customer });

    const seller = await prisma.user.upsert({
        where: { email: 'seller@greenery.com' },
        update: {},
        create: {
            email: 'seller@greenery.com',
            username: 'seller',
            name: 'Jane Seller',
            password: await bcrypt.hash('seller123', 10),
            role: 'SELLER',
            status: 'ACTIVE',
            isVerified: true,
            sellerProfile: {
                create: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    address: '123 Green St, NY',
                    description: 'Purveyor of fine plants.'
                }
            }
        },
    });
    console.log({ seller });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
