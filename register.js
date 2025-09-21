document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if(password !== confirmPassword) {
        alert('两次输入的密码不一致！');
        return;
    }

    if(username === 'admin') {
        alert('无法使用');
        return;
    }
    if(username ==='or 1=1'&& password ==='123' && password==='or 1=1') {
        alert('无法使用');
        return;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d_]{6,}$/;
    if(!passwordRegex.test(password)) {
        alert('密码必须至少6位，包含字母和数字，可包含下划线');
        return;
    }
    }
        const invalidChars = /[^\w\u4e00-\u9fa5]/; // 只允许字母数字下划线和中文
    if(invalidChars.test(username)) {
        alert('用户名包含非法字符，请使用字母、数字或中文');
        return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if(users.some(u => u.username === username)) {
        alert('用户名已存在！');
        return;
    }

    // 生成唯一的验证码
    const verificationCode = Math.random().toString(36).substring(2, 15);
    
    // 创建验证文件
    const verificationFile = {
        username: username,
        verificationCode: verificationCode,
        createdAt: new Date().toISOString()
    };
    
    // 将验证文件存储在模拟的文件系统中
    const fileSystem = JSON.parse(localStorage.getItem('fileSystem') || '{}');
    if (!fileSystem.verificationFiles) {
        fileSystem.verificationFiles = {};
    }
    fileSystem.verificationFiles[`verify_${username}.json`] = verificationFile;
    localStorage.setItem('fileSystem', JSON.stringify(fileSystem));

    users.push({
        username: username,
        password: password,
        balance: 0,
        verificationCode: verificationCode
    });

    localStorage.setItem('users', JSON.stringify(users));
    
    // 生成用户信息文件
    const userInfo = {
        username: username,
        registrationTime: new Date().toISOString(),
        purchaseHistory: [],
        rechargeHistory: [],
        balance: 0,
        verificationCode: verificationCode
    };
    
    // 将用户信息存储在 localStorage 中作为独立的"文件"
    const userFiles = JSON.parse(localStorage.getItem('userFiles') || '{}');
    userFiles[username] = userInfo;
    localStorage.setItem('userFiles', JSON.stringify(userFiles));

    alert('注册成功！验证文件已生成。');
    window.location.href = 'index2.html';
}); 