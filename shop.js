// 检查是否是用户登录
if (localStorage.getItem('userType') !== 'user') {
    window.location.href = 'login.html';
}

// 显示用户名
document.getElementById('username').textContent = localStorage.getItem('currentUser');

// 显示余额
function updateBalance() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === currentUser);
    document.getElementById('balance').textContent = user.balance || 0;
}
updateBalance();

// 显示充值模态框
function showRechargeModal() {
    document.getElementById('rechargeModal').style.display = 'block';
}

// 显示购买记录模态框
function showPurchaseHistory() {
    const currentUser = localStorage.getItem('currentUser');
    const records = JSON.parse(localStorage.getItem('purchaseRecords') || '[]');
    const userRecords = records.filter(record => record.username === currentUser);
    
    const historyContainer = document.getElementById('purchaseHistory');
    if (userRecords.length === 0) {
        historyContainer.innerHTML = '<p>暂无购买记录</p>';
    } else {
        historyContainer.innerHTML = userRecords.map(record => `
            <div class="record-item">
                <div>
                    <div>商品：${record.productName}</div>
                    <div>价格：¥${record.price}</div>
                    <div>时间：${new Date(record.time).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('historyModal').style.display = 'block';
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}

// 充值功能
function recharge() {
    const amount = parseFloat(document.getElementById('rechargeAmount').value);
    if (!amount || amount <= 0) {
        alert('请输入有效的充值金额！');
        return;
    }
    
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === currentUser);
    
    // 添加充值记录
    const rechargeRecords = JSON.parse(localStorage.getItem('rechargeRecords') || '[]');
    rechargeRecords.push({
        username: currentUser,
        amount: amount,
        time: new Date().toISOString(),
        status: 'pending' // 等待管理员确认
    });
    localStorage.setItem('rechargeRecords', JSON.stringify(rechargeRecords));
    
    alert('充值申请已提交，等待管理员确认！');
    document.getElementById('rechargeAmount').value = '';
    closeModal('rechargeModal');
}

// 更新访问计数
// 只有普通用户才计入访问人数
if (localStorage.getItem('userType') === 'user') {
    let visitorCount = parseInt(localStorage.getItem('visitorCount') || '0');
    localStorage.setItem('visitorCount', (visitorCount + 1).toString());
}

// 显示商品列表
function displayProducts() {
    const productGrid = document.getElementById('productGrid');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    console.log('加载的商品数据:', products); // 调试用

    productGrid.innerHTML = '';
    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            ${product.image ? `<img src="${product.image}" class="product-image" alt="${product.name}">` : ''}
            <h3>${product.name}</h3>
            ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
            <p class="product-price">价格: ¥${product.price}</p>
            <button onclick="buyProduct(${product.id})">购买</button>
        `;
        productGrid.appendChild(div);
    });
    
    // 如果没有商品，显示提示信息
    if (products.length === 0) {
        productGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">暂无商品</p>';
    }
}

// 购买商品
function buyProduct(id) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.id === id);
    
    // 检查余额
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === currentUser);
    
    if (typeof user.balance === 'undefined') {
        user.balance = 0;
    }
    
    if (user.balance < product.price) {
        alert('余额不足，请充值！');
        return;
    }
    
    if (confirm(`确定要购买 ${product.name} 吗？价格：¥${product.price}`)) {
        // 扣除余额
        user.balance -= product.price;
        localStorage.setItem('users', JSON.stringify(users));
        updateBalance();
        
        // 更新总收益
        let totalRevenue = parseFloat(localStorage.getItem('totalRevenue') || '0');
        totalRevenue += product.price;
        localStorage.setItem('totalRevenue', totalRevenue.toString());
        
        // 记录购买记录
        const purchaseRecords = JSON.parse(localStorage.getItem('purchaseRecords') || '[]');
        purchaseRecords.push({
            username: currentUser,
            productId: id,
            productName: product.name,
            price: product.price,
            time: new Date().toISOString()
        });
        localStorage.setItem('purchaseRecords', JSON.stringify(purchaseRecords));
        
        alert('购买成功！');
    }
}

// 退出登录
function logout() {
    const currentUser = localStorage.getItem('currentUser');
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
    const index = onlineUsers.indexOf(currentUser);
    if (index > -1) {
        onlineUsers.splice(index, 1);
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }
    localStorage.removeItem('userType');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// 页面关闭时自动退出登录
window.addEventListener('beforeunload', function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
        const index = onlineUsers.indexOf(currentUser);
        if (index > -1) {
            onlineUsers.splice(index, 1);
            localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
        }
    }
});

// 初始化显示商品
displayProducts();

// 显示轮播图
function displayBanners() {
    const banners = JSON.parse(localStorage.getItem('banners') || '[]');
    const container = document.getElementById('bannerImages');
    
    if (banners.length > 0) {
        let currentIndex = 0;
        container.innerHTML = `<img src="${banners[currentIndex].image}" alt="轮播图">`;
        
        // 自动轮播
        setInterval(() => {
            currentIndex = (currentIndex + 1) % banners.length;
            container.innerHTML = `<img src="${banners[currentIndex].image}" alt="轮播图">`;
        }, 3000);
    }
}

// 初始化轮播图
displayBanners(); 