document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // 检查是否是管理员账号
    if(username === 'admin' && password === 'zzs02282318') {
        localStorage.setItem('userType', 'admin');
        updateOnlineUsers('admin');
        window.location.href = 'admin.html';
        return;
    }

    // 检查普通用户登录
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if(user) {
        // 检查验证文件是否存在
        const fileSystem = JSON.parse(localStorage.getItem('fileSystem') || '{}');
        const verificationFiles = fileSystem.verificationFiles || {};
        const verificationFile = verificationFiles[`verify_${username}.json`];
        
        if (!verificationFile) {
            alert('未找到验证文件！');
            return;
        }
        
        if (verificationFile.username !== username || 
            verificationFile.verificationCode !== user.verificationCode) {
            alert('验证文件无效！');
            return;
        }
        
        // 验证成功，继续登录
        localStorage.setItem('userType', 'user');
        localStorage.setItem('currentUser', username);
        updateOnlineUsers(username);
        window.location.href = 'shop.html';
    } else {
        alert('用户名或密码错误！');
    }
});

// 当输入用户名时，显示文件上传框
document.getElementById('username').addEventListener('input', function(e) {
    const username = e.target.value;
    const verificationFileGroup = document.getElementById('verificationFileGroup');
    if (username === 'admin') {
        verificationFileGroup.style.display = 'none';
    } else {
        verificationFileGroup.style.display = 'block';
    }
});

// 更新在线用户
function updateOnlineUsers(username) {
    let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
    if (!onlineUsers.includes(username)) {
        onlineUsers.push(username);
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }
} 