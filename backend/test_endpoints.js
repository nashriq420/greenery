const http = require('http');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'test_results.txt');

function log(message) {
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
}

// Clear log file
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

function makeRequest(reqPath, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: reqPath,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                log(`\n[${method} ${reqPath}] Status: ${res.statusCode}`);
                log(`Body: ${data}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            log(`\n[${method} ${reqPath}] Error: ${e.message}`);
            resolve();
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function runTests() {
    log('--- Testing /health ---');
    await makeRequest('/health');

    log('\n--- Testing /api/auth/login (Invalid) ---');
    await makeRequest('/api/auth/login', 'POST', JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123'
    }));
}

runTests();
