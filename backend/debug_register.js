const http = require('http');

const registerData = JSON.stringify({
    email: 'debug_v2@example.com',
    password: 'password123',
    name: 'Debug User',
    role: 'CUSTOMER'
});

const registerOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': registerData.length
    }
};

console.log('Registering user...');
const req = http.request(registerOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`Register Status: ${res.statusCode}`);
        console.log(`Register Body: ${body}`);

        let token;
        try {
            const json = JSON.parse(body);
            token = json.token; // Check if token is returned on register? usually it is.
            if (!token && json.user) {
                // If not returned on register, try login
                console.log('Token not in register response, trying login...');
                doLogin();
                return;
            }
            if (res.statusCode === 400) {
                console.log('Registration failed (likely exists), trying login...');
                doLogin();
                return;
            }
        } catch (e) {
            console.error('Failed to parse register response', e);
            return;
        }

        if (token) {
            console.log('Token obtained. Fetching feed...');
            fetchFeed(token);
        }
    });
});
req.write(registerData);
req.end();

function doLogin() {
    const loginData = JSON.stringify({
        email: 'debug_v2@example.com',
        password: 'password123'
    });
    const loginReq = http.request({
        hostname: 'localhost',
        port: 4000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log(`Login Status: ${res.statusCode}`);
            try {
                const json = JSON.parse(body);
                if (json.token) fetchFeed(json.token);
                else console.error('No token in login response', body);
            } catch (e) { console.error('Login parse error', e); }
        });
    });
    loginReq.write(loginData);
    loginReq.end();
}

function fetchFeed(token) {
    const feedOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/community/feed',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(feedOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log(`\n\n=== FEED RESPONSE ===`);
            console.log(`Status: ${res.statusCode}`);
            console.log(`Body: ${body}`);
            console.log(`=====================\n`);
        });
    });
    req.on('error', (e) => console.error('Feed req error', e));
    req.end();
}
