const https = require('https');

const checkRoute = (path) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'livechatapp-ajt6.onrender.com',
            port: 443,
            path: path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };
        const req = https.request(options, (res) => {
            resolve({ path, statusCode: res.statusCode });
        });
        req.on('error', () => resolve({ path, statusCode: 500 }));
        req.end();
    });
};

const main = async () => {
    const result1 = await checkRoute('/api/users/reset-ultimate');
    const result2 = await checkRoute('/api/users/reset-all-v3');
    console.log('Results:', [result1, result2]);
    process.exit(0);
};

main();
