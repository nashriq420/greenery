"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const API_URL = 'http://localhost:4000/api';
async function main() {
    try {
        // 1. Register
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`Registering user: ${email}`);
        await axios_1.default.post(`${API_URL}/auth/signup`, {
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
        const loginRes = await axios_1.default.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');
        // 3. Create Post
        console.log('Creating post...');
        const postRes = await axios_1.default.post(`${API_URL}/community/posts`, {
            content: 'Test post content'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Post created successfully:', postRes.data);
    }
    catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}
main();
