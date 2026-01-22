const http = require('http');

const data = JSON.stringify({
    email: 'test@example.com',
    password: 'password'
});

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        const fs = require('fs');
        fs.writeFileSync('login_debug_output.txt', `Status: ${res.statusCode}\nBody: ${body}`);
    });
});

req.on('error', (error) => {
    const fs = require('fs');
    fs.writeFileSync('login_debug_output.txt', `Error: ${error.message}`);
});

req.write(data);
req.end();
