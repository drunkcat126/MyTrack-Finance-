document.addEventListener('DOMContentLoaded', function() {
    // Data initialization
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [
        { id: 1, name: 'Gaji', type: 'income' },
        { id: 2, name: 'Bonus', type: 'income' },
        { id: 3, name: 'Investasi', type: 'income' },
        { id: 4, name: 'Hadiah', type: 'income' },
        { id: 5, name: 'Makanan', type: 'expense' },
        { id: 6, name: 'Transportasi', type: 'expense' },
        { id: 7, name: 'Hiburan', type: 'expense' },
        { id: 8, name: 'Tagihan', type: 'expense' }
    ];
    
    let milestones = JSON.parse(localStorage.getItem('milestones')) || [];
    let editingId = null;
    let monthlyChart = null;
    let reportChart = null;

    // DOM Elements
    const themeSwitcher = document.getElementById('theme-switcher');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const addTransactionBtn = document.getElementById('add-transaction');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const cancelBtns = document.querySelectorAll('.cancel-btn');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const categoryModal = document.getElementById('category-modal');
    const categoryForm = document.getElementById('category-form');
    const addCategoryBtn = document.getElementById('add-category');
    const milestoneModal = document.getElementById('milestone-modal');
    const milestoneForm = document.getElementById('milestone-form');
    const addMilestoneBtn = document.getElementById('add-milestone');
    const milestoneTableBody = document.getElementById('milestones-table-body');
    const transactionModalTitle = document.getElementById('transaction-modal-title');
    const categoryModalTitle = document.getElementById('category-modal-title');
    const milestoneModalTitle = document.getElementById('milestone-modal-title');
    const chartYearSelector = document.getElementById('chart-year-selector');
    const reportTypeSelector = document.getElementById('report-type');
    const reportYearSelector = document.getElementById('report-year');
    const exportPdfBtn = document.getElementById('export-pdf');
    
    const modals = [transactionModal, categoryModal, milestoneModal];

    // Initialize
    initTheme();
    setupEventListeners();
    updateAllViews();
    initYearSelectors();
    updateChart();

    // Main functions
    function updateAllViews() {
        updateDashboard();
        updateTransactionTable();
        updateCategoryTable();
        updateMilestoneTable();
        updateChart();
        generateRecommendations();
    }

    function setupEventListeners() {
        // Theme switcher
        themeSwitcher.addEventListener('click', toggleTheme);
        
        // Add buttons
        addTransactionBtn.addEventListener('click', () => {
            editingId = null;
            transactionModalTitle.textContent = 'Tambah Transaksi';
            transactionForm.reset();
            document.getElementById('transaction-date').valueAsDate = new Date();
            showModal('transaction');
        });
        
        addCategoryBtn.addEventListener('click', () => {
            editingId = null;
            categoryModalTitle.textContent = 'Tambah Kategori';
            categoryForm.reset();
            showModal('category');
        });
        
        addMilestoneBtn.addEventListener('click', () => {
            editingId = null;
            milestoneModalTitle.textContent = 'Tambah Target';
            milestoneForm.reset();
            showModal('milestone');
        });
        
        // Close modal buttons
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideModal();
            });
        });
        
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideModal();
            });
        });
        
        // Click outside modal
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideModal();
                }
            });
            
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        });
        
        // Close with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideModal();
            }
        });
        
        // Form submissions
        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTransaction();
        });
        
        categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveCategory();
        });
        
        milestoneForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveMilestone();
        });
        
        // Navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = this.getAttribute('href').substring(1);
                showContent(target);
            });
        });
        
        // Transaction type change
        transactionTypeSelect.addEventListener('change', function() {
            updateCategoryDropdown(this.value);
        });
        
        // Chart year selector change
        chartYearSelector.addEventListener('change', function() {
            updateChart();
        });
        
        // Report selectors change
        reportTypeSelector.addEventListener('change', function() {
            updateReportChart();
        });
        
        reportYearSelector.addEventListener('change', function() {
            updateReportChart();
        });
        
        // Export PDF button
        exportPdfBtn.addEventListener('click', exportToPdf);
    }

    // Theme functions
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(savedTheme);
    }
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const icon = themeSwitcher.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeSwitcher.querySelector('span').textContent = 'Mode Terang';
        } else {
            icon.className = 'fas fa-moon';
            themeSwitcher.querySelector('span').textContent = 'Mode Gelap';
        }
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }
    
    // UI functions
    function showContent(contentId) {
        document.querySelectorAll('.content-area').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('nav li').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(`${contentId}-content`).classList.remove('hidden');
        document.querySelector(`nav a[href="#${contentId}"]`).parentElement.classList.add('active');
        
        // Update charts when switching to dashboard or report
        if (contentId === 'dashboard') {
            updateChart();
        } else if (contentId === 'laporan') {
            updateReportChart();
        }
    }
    
    function showModal(modalType) {
        hideModal();
        
        if (modalType === 'transaction') {
            updateCategoryDropdown(document.getElementById('transaction-type').value);
            transactionModal.classList.remove('hidden');
            setTimeout(() => {
                const firstInput = transactionModal.querySelector('input, select, textarea');
                if (firstInput) firstInput.focus();
            }, 100);
        } else if (modalType === 'category') {
            categoryModal.classList.remove('hidden');
            setTimeout(() => {
                const firstInput = categoryModal.querySelector('input, select');
                if (firstInput) firstInput.focus();
            }, 100);
        } else if (modalType === 'milestone') {
            milestoneModal.classList.remove('hidden');
            setTimeout(() => {
                const firstInput = milestoneModal.querySelector('input, select');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }
    
    function hideModal() {
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
    }
    
    function updateCategoryDropdown(type) {
        const categorySelect = document.getElementById('transaction-category');
        categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
        const filteredCategories = categories.filter(category => category.type === type);
        filteredCategories.forEach(category => {
            categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });
    }
    
    // Data functions
    function saveTransaction() {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const date = document.getElementById('transaction-date').value;
        const categoryId = parseInt(document.getElementById('transaction-category').value);
        const description = document.getElementById('transaction-description').value;
        
        if (!type || isNaN(amount) || !date || isNaN(categoryId)) {
            alert('Mohon lengkapi semua data transaksi!');
            return;
        }
        
        const category = categories.find(c => c.id === categoryId);
        
        if (editingId) {
            const index = transactions.findIndex(t => t.id === editingId);
            if (index !== -1) {
                transactions[index] = {
                    ...transactions[index],
                    type,
                    amount,
                    date,
                    categoryId,
                    categoryName: category.name,
                    description
                };
            }
        } else {
            transactions.push({
                id: Date.now(),
                type,
                amount,
                date,
                categoryId,
                categoryName: category.name,
                description
            });
        }
        
        saveData();
        hideModal();
        updateAllViews();
    }
    
    function saveCategory() {
        const name = document.getElementById('category-name').value.trim();
        const type = document.getElementById('category-type').value;
        
        if (!name || !type) {
            alert('Mohon lengkapi nama dan jenis kategori!');
            return;
        }
        
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
            alert('Kategori sudah ada!');
            return;
        }
        
        if (editingId) {
            const index = categories.findIndex(c => c.id === editingId);
            if (index !== -1) {
                categories[index] = {
                    ...categories[index],
                    name,
                    type
                };
            }
        } else {
            categories.push({
                id: Date.now(),
                name,
                type
            });
        }
        
        saveData();
        hideModal();
        updateAllViews();
    }
    
    function saveMilestone() {
        const name = document.getElementById('milestone-name').value.trim();
        const target = parseFloat(document.getElementById('milestone-target').value);
        const date = document.getElementById('milestone-date').value;
        
        if (!name || isNaN(target) || !date) {
            alert('Mohon lengkapi semua data target!');
            return;
        }
        
        const totalBalance = calculateTotalBalance();
        
        if (editingId) {
            const index = milestones.findIndex(m => m.id === editingId);
            if (index !== -1) {
                milestones[index] = {
                    ...milestones[index],
                    name,
                    target,
                    date,
                    saved: Math.min(totalBalance, target)
                };
            }
        } else {
            milestones.push({
                id: Date.now(),
                name,
                target,
                date,
                saved: Math.min(totalBalance, target),
                createdAt: new Date().toISOString()
            });
        }
        
        saveData();
        hideModal();
        updateAllViews();
    }
    
    function saveData() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('milestones', JSON.stringify(milestones));
    }
    
    // Calculation functions
    function calculateTotalBalance() {
        let totalIncome = 0;
        let totalExpense = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
        
        return totalIncome - totalExpense;
    }
    
    function getMonthlyData(year) {
        const monthlyIncome = Array(12).fill(0);
        const monthlyExpense = Array(12).fill(0);
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            if (date.getFullYear() == year) {
                const month = date.getMonth();
                if (transaction.type === 'income') {
                    monthlyIncome[month] += transaction.amount;
                } else {
                    monthlyExpense[month] += transaction.amount;
                }
            }
        });
        
        return { monthlyIncome, monthlyExpense };
    }
    
    function getCategoryData(year) {
        const categoryData = {};
        
        // Initialize categories
        categories.forEach(category => {
            categoryData[category.id] = {
                name: category.name,
                type: category.type,
                total: 0
            };
        });
        
        // Calculate totals
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            if (date.getFullYear() == year) {
                if (categoryData[transaction.categoryId]) {
                    categoryData[transaction.categoryId].total += transaction.amount;
                }
            }
        });
        
        return categoryData;
    }
    
    // Update view functions
    function updateDashboard() {
        const totalBalance = calculateTotalBalance();
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        document.getElementById('total-saldo').textContent = formatCurrency(totalBalance);
        document.getElementById('total-pemasukan').textContent = formatCurrency(totalIncome);
        document.getElementById('total-pengeluaran').textContent = formatCurrency(totalExpense);
        
        updateRecentTransactions();
    }
    
    function updateRecentTransactions() {
        const recentTransactionsContainer = document.getElementById('recent-transactions');
        recentTransactionsContainer.innerHTML = '';
        
        const recentTransactions = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        if (recentTransactions.length === 0) {
            recentTransactionsContainer.innerHTML = '<div style="text-align:center;color:var(--text-secondary);">Belum ada transaksi.</div>';
            return;
        }
        
        recentTransactions.forEach(transaction => {
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            
            const iconClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountClass = iconClass;
            const formattedDate = formatDate(transaction.date);
            
            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fas fa-${transaction.type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.categoryName}</h4>
                        <p>${formattedDate}</p>
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            `;
            
            recentTransactionsContainer.appendChild(transactionEl);
        });
    }
    
    function updateTransactionTable() {
        const tableBody = document.getElementById('transactions-table-body');
        tableBody.innerHTML = '';
        
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedTransactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">Belum ada transaksi.</td></tr>';
            return;
        }
        
        sortedTransactions.forEach(transaction => {
            const formattedDate = formatDate(transaction.date);
            const rowClass = transaction.type === 'income' ? 'income-row' : 'expense-row';
            
            const row = document.createElement('tr');
            row.className = rowClass;
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${transaction.categoryName}</td>
                <td>${transaction.description || '-'}</td>
                <td>${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Event delegation for edit and delete
        tableBody.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            
            if (editBtn) {
                const transactionId = parseInt(editBtn.getAttribute('data-id'));
                editTransaction(transactionId);
            }
            
            if (deleteBtn) {
                const transactionId = parseInt(deleteBtn.getAttribute('data-id'));
                deleteTransaction(transactionId);
            }
        });
    }
    
    function editTransaction(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        editingId = id;
        transactionModalTitle.textContent = 'Edit Transaksi';
        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-description').value = transaction.description || '';
        
        updateCategoryDropdown(transaction.type);
        setTimeout(() => {
            document.getElementById('transaction-category').value = transaction.categoryId;
            showModal('transaction');
        }, 100);
    }
    
    function deleteTransaction(id) {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateAllViews();
        }
    }
    
    function updateCategoryTable() {
        const tableBody = document.getElementById('categories-table-body');
        tableBody.innerHTML = '';
        
        if (categories.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);">Belum ada kategori.</td></tr>';
            return;
        }
        
        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.name}</td>
                <td>${category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-id="${category.id}" data-type="category"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Event delegation for edit and delete
        tableBody.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            
            if (editBtn) {
                const categoryId = parseInt(editBtn.getAttribute('data-id'));
                editCategory(categoryId);
            }
            
            if (deleteBtn && deleteBtn.getAttribute('data-type') === 'category') {
                const categoryId = parseInt(deleteBtn.getAttribute('data-id'));
                deleteCategory(categoryId);
            }
        });
    }
    
    function editCategory(id) {
        const category = categories.find(c => c.id === id);
        if (!category) return;
        
        editingId = id;
        categoryModalTitle.textContent = 'Edit Kategori';
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-type').value = category.type;
        showModal('category');
    }
    
    function deleteCategory(id) {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            const isUsed = transactions.some(t => t.categoryId === id);
            if (isUsed) {
                alert('Kategori tidak dapat dihapus karena sudah digunakan dalam transaksi');
                return;
            }
            categories = categories.filter(c => c.id !== id);
            saveData();
            updateAllViews();
        }
    }
    
    function updateMilestoneTable() {
        const tableBody = document.getElementById('milestones-table-body');
        tableBody.innerHTML = '';
        
        if (milestones.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">Belum ada target.</td></tr>';
            return;
        }
        
        const totalBalance = calculateTotalBalance();
        
        milestones.forEach(milestone => {
            const saved = Math.min(totalBalance, milestone.target);
            const progress = Math.min(Math.round((saved / milestone.target) * 100), 100);
            const progressBar = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <small>${progress}%</small>
            `;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${milestone.name}</td>
                <td>${formatCurrency(milestone.target)}</td>
                <td>${formatCurrency(saved)}</td>
                <td>${progressBar}</td>
                <td>${formatDate(milestone.date)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${milestone.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-id="${milestone.id}" data-type="milestone"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Event delegation for edit and delete
        tableBody.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            
            if (editBtn) {
                const milestoneId = parseInt(editBtn.getAttribute('data-id'));
                editMilestone(milestoneId);
            }
            
            if (deleteBtn && deleteBtn.getAttribute('data-type') === 'milestone') {
                const milestoneId = parseInt(deleteBtn.getAttribute('data-id'));
                deleteMilestone(milestoneId);
            }
        });
    }
    
    function editMilestone(id) {
        const milestone = milestones.find(m => m.id === id);
        if (!milestone) return;
        
        editingId = id;
        milestoneModalTitle.textContent = 'Edit Target';
        document.getElementById('milestone-name').value = milestone.name;
        document.getElementById('milestone-target').value = milestone.target;
        document.getElementById('milestone-date').value = milestone.date;
        showModal('milestone');
    }
    
    function deleteMilestone(id) {
        if (confirm('Apakah Anda yakin ingin menghapus target ini?')) {
            milestones = milestones.filter(m => m.id !== id);
            saveData();
            updateAllViews();
        }
    }
    
    // Chart functions
    function initYearSelectors() {
        const currentYear = new Date().getFullYear();
        const years = [];
        
        // Get all years from transactions
        transactions.forEach(transaction => {
            const year = new Date(transaction.date).getFullYear();
            if (!years.includes(year)) {
                years.push(year);
            }
        });
        
        // If no transactions, use current year
        if (years.length === 0) {
            years.push(currentYear);
        }
        
        // Sort years descending
        years.sort((a, b) => b - a);
        
        // Update year selectors
        chartYearSelector.innerHTML = '';
        reportYearSelector.innerHTML = '';
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            chartYearSelector.appendChild(option.cloneNode(true));
            reportYearSelector.appendChild(option);
        });
        
        // Set default to current year if available
        if (years.includes(currentYear)) {
            chartYearSelector.value = currentYear;
            reportYearSelector.value = currentYear;
        }
    }
    
    function updateChart() {
        const selectedYear = parseInt(chartYearSelector.value) || new Date().getFullYear();
        const { monthlyIncome, monthlyExpense } = getMonthlyData(selectedYear);
        
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        // Destroy previous chart if exists
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: monthlyIncome,
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    },
                    {
                        label: 'Pengeluaran',
                        data: monthlyExpense,
                        backgroundColor: '#e74c3c',
                        borderColor: '#c0392b',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += 'Rp' + context.raw.toLocaleString('id-ID');
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function updateReportChart() {
        const selectedYear = parseInt(reportYearSelector.value) || new Date().getFullYear();
        const reportType = reportTypeSelector.value;
        
        const ctx = document.getElementById('reportChart').getContext('2d');
        
        // Destroy previous chart if exists
        if (reportChart) {
            reportChart.destroy();
        }
        
        if (reportType === 'monthly') {
            const { monthlyIncome, monthlyExpense } = getMonthlyData(selectedYear);
            
            reportChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                    datasets: [
                        {
                            label: 'Pemasukan',
                            data: monthlyIncome,
                            backgroundColor: 'rgba(46, 204, 113, 0.2)',
                            borderColor: '#2ecc71',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Pengeluaran',
                            data: monthlyExpense,
                            backgroundColor: 'rgba(231, 76, 60, 0.2)',
                            borderColor: '#e74c3c',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'Rp' + value.toLocaleString('id-ID');
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += 'Rp' + context.raw.toLocaleString('id-ID');
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
            
            updateMonthlyReportSummary(selectedYear, monthlyIncome, monthlyExpense);
        } else {
            const categoryData = getCategoryData(selectedYear);
            const incomeCategories = [];
            const expenseCategories = [];
            const incomeData = [];
            const expenseData = [];
            
            for (const id in categoryData) {
                const category = categoryData[id];
                if (category.type === 'income' && category.total > 0) {
                    incomeCategories.push(category.name);
                    incomeData.push(category.total);
                } else if (category.total > 0) {
                    expenseCategories.push(category.name);
                    expenseData.push(category.total);
                }
            }
            
            reportChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: [...incomeCategories, ...expenseCategories],
                    datasets: [
                        {
                            data: [...incomeData, ...expenseData],
                            backgroundColor: [
                                '#2ecc71', '#27ae60', '#1abc9c', '#16a085', // Greens for income
                                '#e74c3c', '#c0392b', '#e67e22', '#d35400'  // Reds/Oranges for expense
                            ],
                            borderColor: '#fff',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += 'Rp' + context.raw.toLocaleString('id-ID');
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
            
            updateCategoryReportSummary(selectedYear, categoryData);
        }
    }
    
    function updateMonthlyReportSummary(year, monthlyIncome, monthlyExpense) {
        const reportSummary = document.getElementById('report-summary');
        
        const totalIncome = monthlyIncome.reduce((sum, val) => sum + val, 0);
        const totalExpense = monthlyExpense.reduce((sum, val) => sum + val, 0);
        const netIncome = totalIncome - totalExpense;
        
        const highestIncomeMonth = monthlyIncome.indexOf(Math.max(...monthlyIncome));
        const highestExpenseMonth = monthlyExpense.indexOf(Math.max(...monthlyExpense));
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        reportSummary.innerHTML = `
            <h3>Ringkasan Laporan ${year}</h3>
            <div class="report-summary-item">
                <h4>Total Pemasukan</h4>
                <p>${formatCurrency(totalIncome)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Total Pengeluaran</h4>
                <p>${formatCurrency(totalExpense)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Saldo Bersih</h4>
                <p>${formatCurrency(netIncome)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Bulan dengan Pemasukan Tertinggi</h4>
                <p>${monthNames[highestIncomeMonth]}: ${formatCurrency(monthlyIncome[highestIncomeMonth])}</p>
            </div>
            <div class="report-summary-item">
                <h4>Bulan dengan Pengeluaran Tertinggi</h4>
                <p>${monthNames[highestExpenseMonth]}: ${formatCurrency(monthlyExpense[highestExpenseMonth])}</p>
            </div>
        `;
    }
    
    function updateCategoryReportSummary(year, categoryData) {
        const reportSummary = document.getElementById('report-summary');
        
        let incomeCategories = [];
        let expenseCategories = [];
        let totalIncome = 0;
        let totalExpense = 0;
        
        for (const id in categoryData) {
            const category = categoryData[id];
            if (category.type === 'income' && category.total > 0) {
                incomeCategories.push({
                    name: category.name,
                    total: category.total
                });
                totalIncome += category.total;
            } else if (category.total > 0) {
                expenseCategories.push({
                    name: category.name,
                    total: category.total
                });
                totalExpense += category.total;
            }
        }
        
        // Sort categories by total descending
        incomeCategories.sort((a, b) => b.total - a.total);
        expenseCategories.sort((a, b) => b.total - a.total);
        
        let incomeHTML = '';
        incomeCategories.forEach(cat => {
            incomeHTML += `
                <div class="report-summary-item">
                    <h4>${cat.name}</h4>
                    <p>${formatCurrency(cat.total)} (${Math.round((cat.total / totalIncome) * 100)}%)</p>
                </div>
            `;
        });
        
        let expenseHTML = '';
        expenseCategories.forEach(cat => {
            expenseHTML += `
                <div class="report-summary-item">
                    <h4>${cat.name}</h4>
                    <p>${formatCurrency(cat.total)} (${Math.round((cat.total / totalExpense) * 100)}%)</p>
                </div>
            `;
        });
        
        reportSummary.innerHTML = `
            <h3>Ringkasan Laporan ${year}</h3>
            <div class="report-summary-item">
                <h4>Total Pemasukan</h4>
                <p>${formatCurrency(totalIncome)}</p>
            </div>
            ${incomeHTML}
            <div class="report-summary-item">
                <h4>Total Pengeluaran</h4>
                <p>${formatCurrency(totalExpense)}</p>
            </div>
            ${expenseHTML}
            <div class="report-summary-item">
                <h4>Saldo Bersih</h4>
                <p>${formatCurrency(totalIncome - totalExpense)}</p>
            </div>
        `;
    }
    
    // Recommendation functions
    function generateRecommendations() {
        const recommendationsContainer = document.getElementById('recommendations-container');
        recommendationsContainer.innerHTML = '';
        
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
        
        const recommendations = [];
        
        // Savings rate recommendation
        if (savingsRate < 20) {
            recommendations.push({
                title: 'Tingkatkan Tabungan Anda',
                message: `Rasio tabungan Anda saat ini ${savingsRate.toFixed(1)}%. Disarankan untuk menabung minimal 20% dari pendapatan. Pertimbangkan untuk mengurangi pengeluaran yang tidak perlu.`
            });
        } else {
            recommendations.push({
                title: 'Tabungan yang Baik',
                message: `Selamat! Rasio tabungan Anda ${savingsRate.toFixed(1)}% dari pendapatan. Pertahankan kebiasaan baik ini.`
            });
        }
        
        // Expense category analysis
        const expenseCategories = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (!expenseCategories[t.categoryName]) {
                    expenseCategories[t.categoryName] = 0;
                }
                expenseCategories[t.categoryName] += t.amount;
            });
        
        // Find highest expense category
        let highestExpenseCat = '';
        let highestExpenseAmount = 0;
        for (const cat in expenseCategories) {
            if (expenseCategories[cat] > highestExpenseAmount) {
                highestExpenseAmount = expenseCategories[cat];
                highestExpenseCat = cat;
            }
        }
        
        if (highestExpenseCat && highestExpenseAmount > totalIncome * 0.3) {
            recommendations.push({
                title: 'Pengeluaran Dominan',
                message: `Kategori "${highestExpenseCat}" mengambil ${Math.round((highestExpenseAmount / totalExpense) * 100)}% dari total pengeluaran Anda. Pertimbangkan untuk mengevaluasi pengeluaran ini.`
            });
        }
        
        // Milestone progress
        milestones.forEach(milestone => {
            const progress = (milestone.saved / milestone.target) * 100;
            const daysLeft = Math.ceil(new Date(milestone.date) - new Date()) / (1000 * 60 * 60 * 24);
            
            if (daysLeft > 0) {
                const dailyNeeded = (milestone.target - milestone.saved) / daysLeft;
                
                if (progress < 50 && daysLeft < 30) {
                    recommendations.push({
                        title: 'Target Mendekati Jatuh Tempo',
                        message: `Target "${milestone.name}" baru ${progress.toFixed(1)}% tercapai dengan ${daysLeft} hari tersisa. Anda perlu menabung ${formatCurrency(dailyNeeded)} per hari untuk mencapai target.`
                    });
                }
            }
        });
        
        // Add default recommendation if none
        if (recommendations.length === 0) {
            recommendations.push({
                title: 'Tetap Konsisten',
                message: 'Keuangan Anda dalam kondisi baik. Pertahankan kebiasaan mencatat transaksi dan mengevaluasi pengeluaran secara rutin.'
            });
        }
        
        // Display recommendations
        recommendations.forEach(rec => {
            const recEl = document.createElement('div');
            recEl.className = 'recommendation-card';
            recEl.innerHTML = `
                <h3>${rec.title}</h3>
                <p>${rec.message}</p>
            `;
            recommendationsContainer.appendChild(recEl);
        });
    }
    
    // Export functions
    function exportToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const reportType = reportTypeSelector.value;
        const year = reportYearSelector.value;
        const title = `Laporan Keuangan ${year}`;
        
        // Add title
        doc.setFontSize(18);
        doc.text(title, 105, 20, { align: 'center' });
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Dibuat pada: ${new Date().toLocaleDateString('id-ID')}`, 105, 30, { align: 'center' });
        
        // Add chart image
        const chartCanvas = document.getElementById('reportChart');
        const chartImage = chartCanvas.toDataURL('image/png');
        doc.addImage(chartImage, 'PNG', 15, 40, 180, 100);
        
        // Add summary
        const summary = document.getElementById('report-summary');
        const summaryText = summary.textContent || summary.innerText;
        
        doc.setFontSize(12);
        doc.text('Ringkasan:', 15, 150);
        
        const splitText = doc.splitTextToSize(summaryText, 180);
        doc.text(splitText, 15, 160);
        
        // Save the PDF
        doc.save(`Laporan Keuangan ${year}.pdf`);
    }
    
    // Utility functions
    function formatCurrency(amount) {
        if (isNaN(amount)) return 'Rp0';
        return 'Rp' + amount.toLocaleString('id-ID');
    }
    
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date)) return '-';
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
});