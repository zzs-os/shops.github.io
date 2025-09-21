// 严格模式
'use strict';

// 检查管理员登录状态
function checkAdminAuth() {
    if (localStorage.getItem('userType') !== 'admin') {
        window.location.href = 'index2.html';
        return false;
    }
    return true;
}

// 数据初始化
function initializeData() {
    try {
        if (!localStorage.getItem('visitorCount')) {
            localStorage.setItem('visitorCount', '0');
        }
        if (!localStorage.getItem('totalRevenue')) {
            localStorage.setItem('totalRevenue', '0');
        }
        if (!localStorage.getItem('products')) {
            localStorage.setItem('products', '[]');
        }
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', '[]');
        }
        if (!localStorage.getItem('onlineUsers')) {
            localStorage.setItem('onlineUsers', '[]');
        }
    } catch (error) {
        console.error('数据初始化失败:', error);
        alert('系统初始化失败，请刷新页面重试');
    }
}

// 安全的数据获取函数
function safeGetData(key, defaultValue = '[]') {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : JSON.parse(defaultValue);
    } catch (error) {
        console.error(`获取${key}数据失败:`, error);
        return JSON.parse(defaultValue);
    }
}

// 安全的数据保存函数
function safeSaveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`保存${key}数据失败:`, error);
        alert('数据保存失败，请重试');
        return false;
    }
}

// 更新统计数据显示
function updateDashboard() {
    try {
        const onlineUsers = safeGetData('onlineUsers');
        const onlineUserCount = onlineUsers.filter(user => user !== 'admin').length;
        const visitorCount = localStorage.getItem('visitorCount') || '0';
        const totalRevenue = localStorage.getItem('totalRevenue') || '0';

        document.getElementById('onlineCount').textContent = onlineUserCount;
        document.getElementById('visitorCount').textContent = visitorCount;
        document.getElementById('totalRevenue').textContent = totalRevenue;
    } catch (error) {
        console.error('更新仪表盘失败:', error);
    }
}

// 用户列表更新
function updateUsersList() {
    try {
        const onlineUsers = safeGetData('onlineUsers');
        const users = safeGetData('users');
        const container = document.getElementById('onlineUsers');
        
        if (!container) return;

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>用户名</th>
                        <th>余额</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        users.filter(user => user.username !== 'admin').forEach(user => {
            const isOnline = onlineUsers.includes(user.username);
            const balance = parseFloat(user.balance || 0).toFixed(2); // 修复余额显示
            html += `
                <tr>
                    <td>${escapeHtml(user.username)}</td>
                    <td>${balance}元</td>
                    <td>
                        <span class="status-badge ${isOnline ? 'online' : 'offline'}">
                            ${isOnline ? '在线' : '离线'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-primary" onclick="showUserRecharge('${escapeHtml(user.username)}')">充值</button>
                        <button class="btn btn-primary" onclick="viewUserPurchases('${escapeHtml(user.username)}')">购买记录</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('更新用户列表失败:', error);
        alert('更新用户列表失败，请刷新页面重试');
    }
}

// HTML转义函数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 图片验证函数
function validateImage(file) {
    // 检查文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return false;
    }
    
    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert('只支持JPG、PNG和GIF格式的图片');
        return false;
    }
    
    return true;
}

// 商品管理功能
function addProduct() {
    try {
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const description = document.getElementById('productDescription').value.trim();
        const imageFile = document.getElementById('productImage').files[0];

        // 输入验证
        if (!name || name.length > 100) {
            alert('请输入有效的商品名称（不超过100个字符）');
            return;
        }

        if (isNaN(price) || price < 0 || price > 1000000) {
            alert('请输入有效的价格（0-1000000）');
            return;
        }

        if (description && description.length > 500) {
            alert('商品描述不能超过500个字符');
            return;
        }

        if (imageFile && !validateImage(imageFile)) {
            return;
        }

        // 处理图片上传
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                saveProduct(name, price, description, e.target.result);
            };
            reader.onerror = function() {
                alert('图片读取失败，请重试');
            };
            reader.readAsDataURL(imageFile);
        } else {
            saveProduct(name, price, description, null);
        }
    } catch (error) {
        console.error('添加商品失败:', error);
        alert('添加商品失败，请重试');
    }
}

// 保存商品信息
function saveProduct(name, price, description, imageData) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    console.log('保存前的商品列表:', products); // 调试用
    
    products.push({
        id: Date.now(),
        name: name,
        price: parseFloat(price),
        description: description,
        image: imageData
    });

    localStorage.setItem('products', JSON.stringify(products));
    console.log('保存后的商品列表:', products); // 调试用
    refreshProductList();
    
    // 清空输入框
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

// 图片预览功能
document.getElementById('productImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').innerHTML = `
                <img src="${e.target.result}" alt="预览图片">
            `;
        };
        reader.readAsDataURL(file);
    }
});

// 刷新商品列表显示
function refreshProductList() {
    const productList = document.getElementById('productList');
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    productList.innerHTML = '';
    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            ${product.image ? `<img src="${product.image}" class="product-image" alt="${product.name}">` : ''}
            <div class="product-info">
                <h3>${product.name} - ¥${product.price}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
            </div>
            <div>
                <button onclick="editProduct(${product.id})">编辑</button>
                <button onclick="deleteProduct(${product.id})">删除</button>
            </div>
        `;
        productList.appendChild(div);
    });
}

// 删除商品
function deleteProduct(id) {
    if (confirm('确定要删除这个商品吗？')) {
        let products = JSON.parse(localStorage.getItem('products') || '[]');
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        refreshProductList();
    }
}

// 编辑商品
function editProduct(id) {
    try {
        const products = safeGetData('products');
        const product = products.find(p => p.id === id);
        if (!product) {
            alert('商品不存在');
            return;
        }

        // 创建编辑表单
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="modal-content">
                <h3>编辑商品</h3>
                <div class="form-group">
                    <label>商品名称</label>
                    <input type="text" id="editName" value="${escapeHtml(product.name)}" class="form-control">
                </div>
                <div class="form-group">
                    <label>价格</label>
                    <input type="number" id="editPrice" value="${product.price}" class="form-control">
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea id="editDescription" class="form-control">${escapeHtml(product.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>当前图片</label>
                    ${product.image ? `<img src="${product.image}" style="max-width:200px">` : '无图片'}
                    <input type="file" id="editImage" accept="image/*">
                </div>
                <div class="button-group">
                    <button onclick="saveEditProduct(${id})" class="btn btn-primary">保存</button>
                    <button onclick="closeEditForm()" class="btn btn-secondary">取消</button>
                </div>
            </div>
        `;

        // 显示编辑表单
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editModal';
        modal.appendChild(form);
        document.body.appendChild(modal);
        modal.style.display = 'block';

        addOperationLog('编辑商品', `开始编辑商品 ${product.name}`);
    } catch (error) {
        console.error('打开编辑表单失败:', error);
        alert('操作失败，请重试');
    }
}

// 保存编辑的商品
async function saveEditProduct(id) {
    if (!checkSessionTimeout()) return;
    
    try {
        const name = document.getElementById('editName').value.trim();
        const price = parseFloat(document.getElementById('editPrice').value);
        const description = document.getElementById('editDescription').value.trim();
        const imageFile = document.getElementById('editImage').files[0];

        // 验证输入
        if (!validateProductInput(name, price, description)) return;

        const products = safeGetData('products');
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex === -1) {
            alert('商品不存在');
            return;
        }

        // 处理图片
        let imageData = products[productIndex].image;
        if (imageFile) {
            if (!validateImage(imageFile)) return;
            imageData = await readFileAsDataURL(imageFile);
        }

        // 更新商品信息
        products[productIndex] = {
            ...products[productIndex],
            name,
            price,
            description,
            image: imageData,
            lastModified: new Date().toISOString()
        };

        safeSaveData('products', products);
        addOperationLog('更新商品', `更新商品 ${name}`);
        closeEditForm();
        refreshProductList();
        alert('商品更新成功');
    } catch (error) {
        console.error('保存商品失败:', error);
        alert('保存失败，请重试');
    }
}

// 验证商品输入
function validateProductInput(name, price, description) {
    if (!name || name.length > 100) {
        alert('请输入有效的商品名称（不超过100个字符）');
        return false;
    }

    if (isNaN(price) || price < 0 || price > 1000000) {
        alert('请输入有效的价格（0-1000000）');
        return false;
    }

    if (description && description.length > 500) {
        alert('商品描述不能超过500个字符');
        return false;
    }

    return true;
}

// 读取文件为DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

// 关闭编辑表单
function closeEditForm() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

// 退出登录
function logout() {
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
    const index = onlineUsers.indexOf('admin');
    if (index > -1) {
        onlineUsers.splice(index, 1);
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }
    localStorage.removeItem('userType');
    window.location.href = 'login.html';
}

// 页面切换功能
function showSection(sectionId) {
    // 隐藏所有section
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 移除所有导航项的active类
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 显示选中的section
    document.getElementById(sectionId).style.display = 'block';
    
    // 添加active类到选中的导航项
    document.querySelector(`.nav-item[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    // 刷新相应的数据
    switch(sectionId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'users':
            updateUsersList();
            break;
        case 'products':
            refreshProductList();
            break;
        case 'files':
            updateFileSystem();
            break;
        case 'security':
            updateCertificateInfo();
            break;
        case 'btpanel':
            updateSystemStatus();
            updateServicesList();
            updateSitesList();
            break;
    }
}

// 用户充值功能
function showUserRecharge(username) {
    const amount = prompt(`请输入要为用户 ${username} 充值的金额：`);
    if (!amount) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        alert('请输入有效的充值金额！');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username);
    if (!user) return;
    
    user.balance = (user.balance || 0) + numAmount;
    localStorage.setItem('users', JSON.stringify(users));
    
    // 记录充值
    const rechargeRecords = JSON.parse(localStorage.getItem('rechargeRecords') || '[]');
    rechargeRecords.push({
        username: username,
        amount: numAmount,
        time: new Date().toISOString(),
        status: 'approved',
        adminRecharge: true
    });
    localStorage.setItem('rechargeRecords', JSON.stringify(rechargeRecords));
    
    alert('充值成功！');
    updateUsersList();
}

// 查看用户购买记录
function viewUserPurchases(username) {
    const records = JSON.parse(localStorage.getItem('purchaseRecords') || '[]');
    const userRecords = records.filter(record => record.username === username);
    
    let html = `
        <h4>${username}的购买记录</h4>
        <table>
            <thead>
                <tr>
                    <th>商品名称</th>
                    <th>价格</th>
                    <th>购买时间</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (userRecords.length === 0) {
        html += '<tr><td colspan="3" style="text-align: center;">暂无购买记录</td></tr>';
    } else {
        userRecords.forEach(record => {
            html += `
                <tr>
                    <td>${record.productName}</td>
                    <td>${record.price}元</td>
                    <td>${new Date(record.time).toLocaleString()}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('purchaseRecords').innerHTML = html;
}

// 文件系统管理
function updateFileSystem() {
    const fileSystem = JSON.parse(localStorage.getItem('fileSystem') || '{}');
    const container = document.getElementById('fileSystem');
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>文件名</th>
                    <th>用户名</th>
                    <th>创建时间</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const verificationFiles = fileSystem.verificationFiles || {};
    for (const fileName in verificationFiles) {
        const file = verificationFiles[fileName];
        html += `
            <tr>
                <td>${fileName}</td>
                <td>${file.username}</td>
                <td>${new Date(file.createdAt).toLocaleString()}</td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// 清除统计数据
function clearStats() {
    if (confirm('确定要清除访问人数和收益数据吗？此操作不可恢复！')) {
        localStorage.setItem('visitorCount', '0');
        localStorage.setItem('totalRevenue', '0');
        updateDashboard();
        alert('统计数据已清除！');
    }
}

// 添加会话超时检查
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟超时
let lastActivity = Date.now();

function checkSessionTimeout() {
    if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        alert('会话已超时，请重新登录');
        logout();
        return false;
    }
    lastActivity = Date.now();
    return true;
}

// 添加操作日志功能
function addOperationLog(operation, details) {
    try {
        const logs = safeGetData('adminLogs', '[]');
        logs.push({
            time: new Date().toISOString(),
            operation: operation,
            details: details,
            ip: '获取IP', // 实际应用中从服务器获取
        });
        if (logs.length > 1000) logs.shift(); // 限制日志数量
        safeSaveData('adminLogs', logs);
    } catch (error) {
        console.error('记录操作日志失败:', error);
    }
}

// 数据备份功能
function backupData() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            users: safeGetData('users'),
            products: safeGetData('products'),
            purchaseRecords: safeGetData('purchaseRecords'),
            rechargeRecords: safeGetData('rechargeRecords'),
            visitorCount: localStorage.getItem('visitorCount'),
            totalRevenue: localStorage.getItem('totalRevenue')
        };
        
        const backups = safeGetData('dataBackups', '[]');
        backups.push(backup);
        if (backups.length > 10) backups.shift(); // 保留最近10个备份
        safeSaveData('dataBackups', backups);
        
        addOperationLog('数据备份', '创建了新的数据备份');
        return true;
    } catch (error) {
        console.error('数据备份失败:', error);
        alert('数据备份失败，请重试');
        return false;
    }
}

// 恢复数据功能
function restoreData(backupIndex) {
    try {
        const backups = safeGetData('dataBackups');
        if (!backups[backupIndex]) {
            alert('备份数据不存在');
            return false;
        }
        
        const backup = backups[backupIndex];
        safeSaveData('users', backup.users);
        safeSaveData('products', backup.products);
        safeSaveData('purchaseRecords', backup.purchaseRecords);
        safeSaveData('rechargeRecords', backup.rechargeRecords);
        localStorage.setItem('visitorCount', backup.visitorCount);
        localStorage.setItem('totalRevenue', backup.totalRevenue);
        
        addOperationLog('数据恢复', `恢复到${backup.timestamp}的备份`);
        return true;
    } catch (error) {
        console.error('数据恢复失败:', error);
        alert('数据恢复失败，请重试');
        return false;
    }
}

// 证书管理功能
function generateNewCertificate() {
    try {
        // 生成新的证书信息
        const certificate = {
            id: Date.now(),
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年有效期
            issuer: 'Shopping System Admin',
            publicKey: generateRandomKey(),
            privateKey: generateRandomKey(),
            signature: generateSignature()
        };

        // 保存证书
        const certificates = safeGetData('certificates', '[]');
        certificates.push(certificate);
        safeSaveData('certificates', certificates);

        // 设置为当前证书
        localStorage.setItem('currentCertificate', certificate.id);
        
        addOperationLog('证书管理', '生成了新的安全证书');
        updateCertificateInfo();
        alert('新证书生成成功！');
    } catch (error) {
        console.error('生成证书失败:', error);
        alert('生成证书失败，请重试');
    }
}

// 导出证书
function exportCertificate() {
    try {
        const certId = localStorage.getItem('currentCertificate');
        const certificates = safeGetData('certificates');
        const cert = certificates.find(c => c.id === parseInt(certId));
        
        if (!cert) {
            alert('未找到有效证书');
            return;
        }

        // 创建证书文件
        const certData = {
            id: cert.id,
            issuedAt: cert.issuedAt,
            expiresAt: cert.expiresAt,
            issuer: cert.issuer,
            publicKey: cert.publicKey,
            signature: cert.signature
        };

        const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${cert.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addOperationLog('证书管理', '导出了安全证书');
    } catch (error) {
        console.error('导出证书失败:', error);
        alert('导出证书失败，请重试');
    }
}

// 导入证书
function importCertificate() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const certData = JSON.parse(e.target.result);
                validateAndImportCertificate(certData);
            } catch (error) {
                console.error('解析证书失败:', error);
                alert('证书格式无效');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// 验证并导入证书
function validateAndImportCertificate(certData) {
    try {
        // 验证证书格式
        if (!certData.id || !certData.issuedAt || !certData.expiresAt || 
            !certData.issuer || !certData.publicKey || !certData.signature) {
            throw new Error('证书格式无效');
        }

        // 验证证书签名
        if (!verifyCertificateSignature(certData)) {
            throw new Error('证书签名无效');
        }

        // 验证是否过期
        if (new Date(certData.expiresAt) < new Date()) {
            throw new Error('证书已过期');
        }

        // 保存证书
        const certificates = safeGetData('certificates', '[]');
        if (!certificates.some(c => c.id === certData.id)) {
            certificates.push(certData);
            safeSaveData('certificates', certificates);
        }

        localStorage.setItem('currentCertificate', certData.id);
        addOperationLog('证书管理', '导入了新的安全证书');
        updateCertificateInfo();
        alert('证书导入成功！');
    } catch (error) {
        console.error('验证证书失败:', error);
        alert(`证书验证失败: ${error.message}`);
    }
}

// 更新证书信息显示
function updateCertificateInfo() {
    try {
        const certId = localStorage.getItem('currentCertificate');
        const certificates = safeGetData('certificates');
        const cert = certificates.find(c => c.id === parseInt(certId));
        
        const statusElement = document.getElementById('certStatus');
        const expiryElement = document.getElementById('certExpiry');
        
        if (!cert) {
            statusElement.textContent = '未安装证书';
            statusElement.className = 'cert-status expired';
            expiryElement.textContent = '无';
            return;
        }

        const now = new Date();
        const expiryDate = new Date(cert.expiresAt);
        const isValid = expiryDate > now;

        statusElement.textContent = isValid ? '有效' : '已过期';
        statusElement.className = `cert-status ${isValid ? 'valid' : 'expired'}`;
        expiryElement.textContent = expiryDate.toLocaleString();

        // 更新证书历史记录
        updateCertificateHistory();
    } catch (error) {
        console.error('更新证书信息失败:', error);
    }
}

// 更新证书历史记录
function updateCertificateHistory() {
    try {
        const certificates = safeGetData('certificates');
        const container = document.getElementById('certificateHistory');
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>证书ID</th>
                        <th>颁发时间</th>
                        <th>过期时间</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        certificates.forEach(cert => {
            const isValid = new Date(cert.expiresAt) > new Date();
            html += `
                <tr>
                    <td>${cert.id}</td>
                    <td>${new Date(cert.issuedAt).toLocaleString()}</td>
                    <td>${new Date(cert.expiresAt).toLocaleString()}</td>
                    <td>
                        <span class="cert-status ${isValid ? 'valid' : 'expired'}">
                            ${isValid ? '有效' : '已过期'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('更新证书历史记录失败:', error);
    }
}

// 辅助函数
function generateRandomKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateSignature() {
    return crypto.getRandomValues(new Uint8Array(32))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}

function verifyCertificateSignature(certData) {
    // 实际应用中应该进行真正的签名验证
    return true;
}

// 宝塔面板 API 配置
const BT_CONFIG = {
    url: 'http://your-panel-ip:8888',  // 替换为您的宝塔面板地址
    key: 'your-api-key'                // 替换为您的API密钥
};

// 宝塔面板 API 请求函数
async function btRequest(endpoint, data = {}) {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const requestData = {
            ...data,
            request_token: timestamp,
            request_time: timestamp
        };

        const response = await fetch(`${BT_CONFIG.url}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': BT_CONFIG.key
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === false) {
            throw new Error(result.msg || '请求失败');
        }

        return result;
    } catch (error) {
        console.error('宝塔面板API请求失败:', error);
        alert(`操作失败: ${error.message}`);
        throw error;
    }
}

// 更新系统状态
async function updateSystemStatus() {
    try {
        const systemInfo = await btRequest('/system', { action: 'GetSystemTotal' });
        
        document.getElementById('cpuUsage').innerText = `${systemInfo.cpu[0]}%`;
        document.getElementById('memoryUsage').innerText = `${systemInfo.mem.memRealUsed}%`;
        document.getElementById('diskUsage').innerText = `${systemInfo.disk[0].size[3]}%`;
        document.getElementById('networkSpeed').innerText = 
            `↑${formatSpeed(systemInfo.up)} ↓${formatSpeed(systemInfo.down)}`;
        
        // 添加更多系统信息显示
        document.getElementById('systemInfo').innerHTML = `
            <div class="info-item">
                <span>系统负载:</span> ${systemInfo.load.join(' ')}
            </div>
            <div class="info-item">
                <span>运行时间:</span> ${systemInfo.time}
            </div>
        `;
    } catch (error) {
        console.error('获取系统状态失败:', error);
    }
}

// 更新服务列表
async function updateServicesList() {
    try {
        const services = await btRequest('/system', { action: 'GetNetworkList' });
        const servicesList = document.getElementById('servicesList');
        
        servicesList.innerHTML = services.map(service => `
            <tr>
                <td>${service.name}</td>
                <td>
                    <span class="status-badge ${service.status ? 'running' : 'stopped'}">
                        ${service.status ? '运行中' : '已停止'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="controlService('${service.name}', 'restart')">
                        重启
                    </button>
                    <button class="btn btn-sm btn-${service.status ? 'danger' : 'success'}" 
                            onclick="controlService('${service.name}', '${service.status ? 'stop' : 'start'}')">
                        ${service.status ? '停止' : '启动'}
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('获取服务列表失败:', error);
    }
}

// 更新网站列表
async function updateSitesList() {
    try {
        const sites = await btRequest('/data', { action: 'getData', table: 'sites' });
    const sitesList = document.getElementById('sitesList');
        
        sitesList.innerHTML = sites.data.map(site => `
            <tr>
                <td>${site.name}</td>
                <td>
                    <span class="status-badge ${site.status ? 'running' : 'stopped'}">
                        ${site.status ? '运行中' : '已停止'}
                    </span>
                </td>
                <td>PHP ${site.php_version}</td>
            <td>
                <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="controlSite('${site.name}', 'settings')">
                        <i class="fas fa-cog"></i> 设置
                    </button>
                        <button class="btn btn-sm btn-primary" onclick="controlSite('${site.name}', 'files')">
                        <i class="fas fa-folder"></i> 文件
                    </button>
                        <button class="btn btn-sm btn-primary" onclick="controlSite('${site.name}', 'database')">
                        <i class="fas fa-database"></i> 数据库
                    </button>
                        <button class="btn btn-sm btn-primary" onclick="controlSite('${site.name}', 'ssl')">
                        <i class="fas fa-lock"></i> SSL
                    </button>
                        <button class="btn btn-sm btn-danger" onclick="controlSite('${site.name}', 'delete')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    } catch (error) {
        console.error('获取网站列表失败:', error);
    }
}

// 控制服务
async function controlService(service, action) {
    try {
        const result = await btRequest('/system', {
            action: 'ServiceAdmin',
            name: service,
            type: action
        });
        
        alert(`${service} ${action === 'restart' ? '重启' : action === 'stop' ? '停止' : '启动'}成功`);
        updateServicesList();
    } catch (error) {
        console.error(`控制服务失败: ${service} ${action}`, error);
    }
}

// 创建网站
async function createSite() {
    const domain = prompt('请输入域名：');
    if (!domain) return;
    
    try {
        const result = await btRequest('/site', {
            action: 'AddSite',
            webname: domain,
            path: `/www/wwwroot/${domain}`,
            type: 'PHP',
            version: '7.4',
            port: '80'
        });
        
        alert('网站创建成功！');
        updateSitesList();
    } catch (error) {
        console.error('创建网站失败:', error);
    }
}

// 格式化网速显示
function formatSpeed(bytes) {
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let speed = bytes;
    let unitIndex = 0;
    
    while (speed >= 1024 && unitIndex < units.length - 1) {
        speed /= 1024;
        unitIndex++;
    }
    
    return `${speed.toFixed(1)} ${units[unitIndex]}`;
}

// 定期刷新状态
setInterval(() => {
    if (document.getElementById('btpanel').style.display !== 'none') {
        updateSystemStatus();
        updateServicesList();
        updateSitesList();
    }
}, 3000);

// 初始化
if (checkAdminAuth()) {
    initializeData();
    showSection('dashboard');
    
    // 定期刷新数据
    const refreshInterval = setInterval(() => {
        if (!checkAdminAuth()) {
            clearInterval(refreshInterval);
            return;
        }
        updateDashboard();
    }, 5000);
}

// 初始化时添加自动备份
setInterval(() => {
    if (checkAdminAuth() && checkSessionTimeout()) {
        backupData();
    }
}, 30 * 60 * 1000); // 每30分钟备份一次

// 添加全局错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('全局错误:', {message, source, lineno, colno, error});
    addOperationLog('系统错误', message);
    return false;
};

// 添加网络状态监控
window.addEventListener('online', () => {
    console.log('网络已连接');
    updateDashboard();
});

window.addEventListener('offline', () => {
    console.log('网络已断开');
    alert('网络连接已断开，部分功能可能无法使用');
});

// 初始化宝塔面板
document.addEventListener('DOMContentLoaded', function() {
    // 初始化面板状态
    updateSystemStatus();
    updateServicesList();
    updateSitesList();
}); 