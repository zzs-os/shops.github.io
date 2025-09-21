const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');

const app = express();
// ... existing code ...

// 新增中间件：SQL注入检测
app.use((req, res, next) => {
    const sqlInjectionPatterns = [
        /\b(?:or\s+1\s*=\s*1)\b/i,
        /\b(?:select\s+\*\s+from)\b/i,
        /\b(?:union\s+select)\b/i
    ];

    const isSqlInjection = sqlInjectionPatterns.some(pattern => 
        pattern.test(req.query.q) || pattern.test(req.body)
    );

    if (isSqlInjection) {
        const ip = req.ip || req.connection.remoteAddress;
        fs.appendFileSync('blacklist.txt', `${new Date().toISOString()} | ${ip} | SQL注入尝试\n`);
        return res.status(403).send('<h1 style="color:red">非法输入检测到SQL注入尝试！您的IP已被记录</h1>');
    }
    next();
});

// 管理员路由
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 黑名单查看路由
app.get('/admin/blacklist', (req, res) => {
    try {
        const blacklist = fs.readFileSync('blacklist.txt', 'utf8');
        res.send(`<h1>SQL注入黑名单</h1><pre>${blacklist}</pre>`);
    } catch {
        res.send('<h1>暂无黑名单记录</h1>');
    }
});
// ... existing code ...

// 添加SQL注入记录路由
app.post('/logSqlInjection', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const attempt = req.body.attempt;
    
    fs.appendFileSync('sql_injection_log.txt', 
        `${new Date().toISOString()} | ${ip} | ${attempt}\n`);
    
    res.sendStatus(200);
});
// ... existing code ...
// ... existing code ...
// 安全头部
app.use(helmet());

// HSTS
app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
}));

// 证书配置
const options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'privatekey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.pem')),
    minVersion: 'TLSv1.2', // 最低 TLS 版本
    ciphers: [
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
    ].join(':'),
    honorCipherOrder: true
};

// 静态文件服务
app.use(express.static('public', {
    setHeaders: (res, path) => {
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'DENY');
        res.set('X-XSS-Protection', '1; mode=block');
    }
}));

// 路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 创建 HTTPS 服务器
const server = https.createServer(options, app);

// 启动服务器
const PORT = 443;
server.listen(PORT, () => {
    console.log(`HTTPS 服务器运行在端口 ${PORT}`);
});

// 错误处理
server.on('error', (error) => {
    console.error('服务器错误:', error);
});

// 优雅关闭
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
}); 