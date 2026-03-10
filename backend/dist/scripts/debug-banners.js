"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
async function checkBanners() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };
    try {
        const banners = await prisma.banner.findMany({
            include: { listing: true }
        });
        log('--- Current Server Time ---');
        log(new Date().toString());
        log(new Date().toISOString());
        log('\n--- All Banners ---');
        if (banners.length === 0) {
            log('No banners found.');
        }
        else {
            banners.forEach(b => {
                log(`ID: ${b.id}`);
                log(`Title: ${b.title}`);
                log(`Status: ${b.status}`);
                log(`Start Date: ${b.startDate}`);
                log(`End Date:   ${b.endDate}`);
                log(`Is Active?: ${b.status === 'APPROVED' && b.startDate && b.endDate && new Date() >= b.startDate && new Date() <= b.endDate}`);
                log('---------------------------');
            });
        }
        fs_1.default.writeFileSync('banner_debug_log.txt', output);
        console.log('Log written to banner_debug_log.txt');
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkBanners();
