const https = require('https');

const options = {
    hostname: 'livechatapp-ajt6.onrender.com',
    port: 443,
    path: '/api/users/reset-all-v3',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Production Reset Response:', data);
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`Problem with production reset request: ${e.message}`);
    process.exit(1);
});

req.end();
