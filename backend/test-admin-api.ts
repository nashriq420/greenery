import { prisma } from './src/utils/prisma';
import jwt from 'jsonwebtoken';


async function main() {
  try {
    // 1. Get an admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('No admin found, creating one...');
      // create admin if needed, but assuming one exists
      return;
    }

    // 2. Generate token
    const token = jwt.sign(
      { id: admin.id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1h' }
    );

    // 3. Make request
    console.log('Making request to http://localhost:4000/blacklist/admin');
    const response = await fetch('http://localhost:4000/blacklist/admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${text.substring(0, 500)}`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
