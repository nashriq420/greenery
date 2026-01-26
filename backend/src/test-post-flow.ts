import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';

async function main() {
    try {
        // 1. Register
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`Registering user: ${email}`);
        await axios.post(`${API_URL}/auth/signup`, {
            email,
            password,
            name: 'Test User',
            role: 'CUSTOMER'
        });

        // Activate User
        await prisma.user.update({
            where: { email },
            data: { status: 'ACTIVE' }
        });
        console.log('User activated manually.');

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // 3. Create Post
        console.log('Creating post...');
        const postRes = await axios.post(`${API_URL}/community/posts`, {
            content: 'Test post content'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Post created successfully:', postRes.data);
    } catch (error: any) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

main();
