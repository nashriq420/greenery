const http = require('http');

const imageUrl = 'http://localhost:4000/uploads/1770175356294-472214369.jpg';
const encodedUrl = encodeURIComponent(imageUrl);
const nextImagePath = `/_next/image?url=${encodedUrl}&w=1920&q=75`;

const options = {
    hostname: 'localhost',
    port: 3000,
    path: nextImagePath,
    method: 'GET',
};

console.log(`Requesting: http://localhost:3001${nextImagePath}`);

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', (e) => {
    console.error('Request error', e);
    // Types of errors: connection refused (wrong port?), etc.
});

req.end();
