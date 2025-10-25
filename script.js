document.addEventListener('DOMContentLoaded', function() {
    
    // Nilai Tukar (Base: USD)
    const conversionRates = {
        "USD": 1.0,
        "IDR": 16000.0,
        "SGD": 1.35
    };

    // Data initialization
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [
        { id: 1, name: 'Salary', type: 'income' },
        { id: 2, name: 'Bonus', type: 'income' },
        { id: 3, name: 'Investment', type: 'income' },
        { id: 4, name: 'Gift', type: 'income' },
        { id: 5, name: 'Food', type: 'expense' },
        { id: 6, name: 'Transport', type: 'expense' },
        { id: 7, name: 'Entertainment', type: 'expense' },
        { id: 8, name: 'Bills', type: 'expense' }
    ];
    let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
    let milestones = JSON.parse(localStorage.getItem('milestones')) || [];
    let editingId = null;
    let monthlyChart = null;
    let reportChart = null;
    let currentCurrency = 'IDR';

    // --- MODERNISASI DOM ACCESS ---
    const DOMElements = {
        // Modals & Forms
        transactionModal: document.getElementById('transaction-modal'),
        categoryModal: document.getElementById('category-modal'),
        milestoneModal: document.getElementById('milestone-modal'),
        budgetModal: document.getElementById('budget-modal'),
        transactionForm: document.getElementById('transaction-form'),
        categoryForm: document.getElementById('category-form'),
        milestoneForm: document.getElementById('milestone-form'),
        budgetForm: document.getElementById('budget-form'),
        transactionModalTitle: document.getElementById('transaction-modal-title'),
        categoryModalTitle: document.getElementById('category-modal-title'),
        milestoneModalTitle: document.getElementById('milestone-modal-title'),
        budgetModalTitle: document.getElementById('budget-modal-title'),
        // Buttons & Selectors
        themeSwitcher: document.getElementById('theme-switcher'),
        currencySwitcher: document.getElementById('currency-switcher'),
        mobileNavToggle: document.getElementById('mobile-nav-toggle'),
        addTransactionBtn: document.getElementById('add-transaction'),
        addCategoryBtn: document.getElementById('add-category'),
        addMilestoneBtn: document.getElementById('add-milestone'),
        addBudgetBtn: document.getElementById('add-budget'),
        reportTypeSelector: document.getElementById('report-type'),
        reportYearSelector: document.getElementById('report-year'),
        exportPdfBtn: document.getElementById('export-pdf'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        // Tables & Containers
        transactionsTableBody: document.getElementById('transactions-table-body'),
        categoriesTableBody: document.getElementById('categories-table-body'),
        milestoneTableBody: document.getElementById('milestones-table-body'),
        budgetsTableBody: document.getElementById('budgets-table-body'),
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('overlay'),
        // Filter
        filterType: document.getElementById('filter-type'),
        filterStartDate: document.getElementById('filter-start-date'),
        filterEndDate: document.getElementById('filter-end-date'),
        filterResetBtn: document.getElementById('filter-reset-btn'),
        // Others
        transactionTypeSelect: document.getElementById('transaction-type'),
        transactionRecurrenceSelect: document.getElementById('transaction-recurrence'),
        recurrenceEndGroup: document.getElementById('recurrence-end-group'),
    };

    const modals = [DOMElements.transactionModal, DOMElements.categoryModal, DOMElements.milestoneModal, DOMElements.budgetModal];
    // PERBAIKAN: Gunakan querySelectorAll untuk close/cancel buttons
    const closeModalElements = document.querySelectorAll('.close-modal, .cancel-btn');


    // Initialize
    generateRecurringTransactions();
    initTheme();
    initCurrency();
    setupEventListeners();
    updateAllViews();
    initYearSelectors();

    // Main functions
    function updateAllViews() {
        // Atur 'step' input berdasarkan mata uang
        const stepValue = currentCurrency === 'IDR' ? '1000' : '0.01';
        document.getElementById('transaction-amount').step = stepValue;
        document.getElementById('milestone-target').step = stepValue;
        document.getElementById('budget-limit').step = stepValue;
        
        // Perbarui simbol mata uang di modal
        const symbol = new Intl.NumberFormat('en-US', { style: 'currency', currency: currentCurrency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(0).replace(/[\d.,]/g, '').trim();
        document.getElementById('modal-currency-symbol').textContent = symbol;
        document.getElementById('milestone-currency-symbol').textContent = symbol;
        document.getElementById('budget-currency-symbol').textContent = symbol;

        updateDashboard();
        updateTransactionTable();
        updateCategoryTable();
        updateMilestoneTable();
        updateBudgetTable();
        generateRecommendations();
       if (!document.getElementById('laporan-content').classList.contains('hidden')) {
            updateReportChart();
        }
    }

    function setupEventListeners() {
        // Theme switcher
        DOMElements.themeSwitcher.addEventListener('click', toggleTheme);
        
        // --- SETUP MODAL DAN FORM LEBIH SINGKAT ---
        
        // Generic Modal Opener
        const setupModalButton = (btn, modalType, titleElement, form, resetForm = true) => {
            btn.addEventListener('click', () => {
                editingId = null;
                titleElement.textContent = `Add ${modalType}`;
                if (resetForm) form.reset();
                if (modalType === 'Transaction') document.getElementById('transaction-date').valueAsDate = new Date();
                showModal(modalType.toLowerCase());
            });
        };
        
        setupModalButton(DOMElements.addTransactionBtn, 'Transaction', DOMElements.transactionModalTitle, DOMElements.transactionForm);
        setupModalButton(DOMElements.addCategoryBtn, 'Category', DOMElements.categoryModalTitle, DOMElements.categoryForm);
        setupModalButton(DOMElements.addMilestoneBtn, 'Target', DOMElements.milestoneModalTitle, DOMElements.milestoneForm);
        setupModalButton(DOMElements.addBudgetBtn, 'Budget', DOMElements.budgetModalTitle, DOMElements.budgetForm); 

        // Close modal buttons (Combined Close/Cancel)
        closeModalElements.forEach(btn => {
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
                // Perbaikan: Pastikan klik di konten modal tidak menyebar ke overlay
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
            // New Feature: Keyboard Shortcut (Ctrl+T)
            if (e.ctrlKey && e.key === 't') {
                 e.preventDefault();
                 DOMElements.addTransactionBtn.click();
            }
        });
        
        // Form submissions
        DOMElements.transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTransaction();
        });
        
        DOMElements.categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveCategory();
        });
        
        DOMElements.milestoneForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveMilestone();
        });

        DOMElements.budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveBudget();
        });
        
        // Navigasi (termasuk penutup menu mobile)
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = this.getAttribute('href').substring(1);
                showContent(target);
                
                if (DOMElements.sidebar.classList.contains('active')) {
                    DOMElements.sidebar.classList.remove('active');
                    DOMElements.overlay.classList.remove('active');
                }
            });
        });
        
        // Transaction type change
        DOMElements.transactionTypeSelect.addEventListener('change', function() {
            updateCategoryDropdown(this.value);
        });

        // New Feature: Recurrence toggle
        DOMElements.transactionRecurrenceSelect.addEventListener('change', function() {
            if (this.value !== 'none') {
                DOMElements.recurrenceEndGroup.classList.remove('hidden');
            } else {
                DOMElements.recurrenceEndGroup.classList.add('hidden');
                document.getElementById('recurrence-end-date').value = '';
            }
        });
        
        // Report selectors change
        DOMElements.reportTypeSelector.addEventListener('change', updateReportChart);
        DOMElements.reportYearSelector.addEventListener('change', updateReportChart);
        
        // Export PDF button
        DOMElements.exportPdfBtn.addEventListener('click', exportToPdf);

        // New Feature: Export CSV
        DOMElements.exportCsvBtn.addEventListener('click', exportToCsv);

        // PERBAIKAN: Melekatkan event listener ke body tabel
        DOMElements.transactionsTableBody.addEventListener('click', handleTableAction('transaction'));
        DOMElements.categoriesTableBody.addEventListener('click', handleTableAction('category'));
        DOMElements.milestoneTableBody.addEventListener('click', handleTableAction('milestone'));
        DOMElements.budgetsTableBody.addEventListener('click', handleTableAction('budget'));

        // Event listener untuk Mata Uang & Navigasi Mobile
        DOMElements.currencySwitcher.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            localStorage.setItem('userCurrency', currentCurrency);
            updateAllViews(); // Render ulang semua dengan mata uang baru
            updateChart(); 
        });

        DOMElements.mobileNavToggle.addEventListener('click', () => {
            DOMElements.sidebar.classList.add('active');
            DOMElements.overlay.classList.add('active');
        });

        DOMElements.overlay.addEventListener('click', () => {
            DOMElements.sidebar.classList.remove('active');
            DOMElements.overlay.classList.remove('active');
        });

        // Event Listeners untuk Filter
        DOMElements.filterType.addEventListener('change', updateTransactionTable);
        DOMElements.filterStartDate.addEventListener('change', updateTransactionTable);
        DOMElements.filterEndDate.addEventListener('change', updateTransactionTable);
        DOMElements.filterResetBtn.addEventListener('click', () => {
            DOMElements.filterType.value = 'all';
            DOMElements.filterStartDate.value = '';
            DOMElements.filterEndDate.value = '';
            updateTransactionTable();
        });
    }

    // --- FUNGSI BARU UNTUK MENGATASI AKSI TABEL (DRY) ---
    function handleTableAction(type) {
        return function(e) {
            // PERBAIKAN: Gunakan e.target.closest untuk mencari tombol
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            
            if (editBtn) {
                const id = parseInt(editBtn.getAttribute('data-id'));
                if (type === 'transaction') editTransaction(id);
                if (type === 'category') editCategory(id);
                if (type === 'milestone') editMilestone(id);
                if (type === 'budget') editBudget(id);
            }
            
            if (deleteBtn) {
                const id = parseInt(deleteBtn.getAttribute('data-id'));
                if (type === 'transaction') deleteTransaction(id);
                if (type === 'category') deleteCategory(id);
                if (type === 'milestone') deleteMilestone(id);
                if (type === 'budget') deleteBudget(id);
            }
        }
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
        const icon = DOMElements.themeSwitcher.querySelector('i');
        const text = DOMElements.themeSwitcher.querySelector('span');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        
        setTimeout(() => {
            updateChart(); 
            
            if (!document.getElementById('laporan-content').classList.contains('hidden')) {
                updateReportChart();
            }
        }, 50); 
    }

    // Inisialisasi Mata Uang
    function initCurrency() {
        const savedCurrency = localStorage.getItem('userCurrency');
        if (savedCurrency && conversionRates[savedCurrency]) {
            currentCurrency = savedCurrency;
        }
        DOMElements.currencySwitcher.value = currentCurrency;
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
        
        
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Your financial summary' },
            transaksi: { title: 'Transaction Management', subtitle: 'View and manage your transactions' },
            anggaran: { title: 'Monthly Budgeting', subtitle: 'Control your spending limits' },
            kategori: { title: 'Category Management', subtitle: 'Organize your income and expenses' },
            target: { title: 'Financial Targets', subtitle: 'Set and track your savings goals' },
            laporan: { title: 'Financial Reports', subtitle: 'Analyze your financial habits' }
        };
        
        const headerTitle = document.querySelector('.header-title h1');
        const headerSubtitle = document.querySelector('.header-title p');
        
        if (titles[contentId]) {
            headerTitle.textContent = titles[contentId].title;
            headerSubtitle.textContent = titles[contentId].subtitle;
        }

        if (contentId === 'dashboard') {
            updateChart(); 
        } else if (contentId === 'laporan') {
            updateReportChart(); 
        } else if (contentId === 'anggaran') {
            updateBudgetTable();
        }
    }
    
    function showModal(modalType) {
        hideModal();
        let modalToShow = null;
        
        if (modalType === 'transaction') {
            updateCategoryDropdown(document.getElementById('transaction-type').value);
            modalToShow = DOMElements.transactionModal;
        } else if (modalType === 'category') {
            modalToShow = DOMElements.categoryModal;
        } else if (modalType === 'milestone') {
            modalToShow = DOMElements.milestoneModal;
        } else if (modalType === 'budget') {
            updateBudgetDropdown();
            modalToShow = DOMElements.budgetModal;
        }

        if (modalToShow) {
            modalToShow.classList.remove('hidden');
            setTimeout(() => {
                const firstInput = modalToShow.querySelector('input, select, textarea');
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
        categorySelect.innerHTML = `<option value="">Select Category</option>`;
        const filteredCategories = categories.filter(category => category.type === type);
        filteredCategories.forEach(category => {
            categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });
    }

    // New Function: Update dropdown for Budget Categories (Expense Only)
    function updateBudgetDropdown() {
        const budgetCategorySelect = document.getElementById('budget-category');
        budgetCategorySelect.innerHTML = `<option value="">Select Category</option>`;
        
        const expenseCategories = categories.filter(c => c.type === 'expense');
        const existingBudgetCategoryIds = budgets.map(b => b.categoryId);
        
        expenseCategories.forEach(category => {
            // Only show categories that are not yet budgeted OR is the one currently being edited
            if (!existingBudgetCategoryIds.includes(category.id) || category.id === editingId) {
                budgetCategorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            }
        });
    }
    
    // Data functions
    function saveTransaction() {
        const type = document.getElementById('transaction-type').value;
        const displayAmount = parseFloat(document.getElementById('transaction-amount').value);
        const date = document.getElementById('transaction-date').value;
        const categoryId = parseInt(document.getElementById('transaction-category').value);
        const description = document.getElementById('transaction-description').value;
        const recurrence = DOMElements.transactionRecurrenceSelect.value;
        const recurrenceEndDate = document.getElementById('recurrence-end-date').value || null;
        
        if (!type || isNaN(displayAmount) || !date || isNaN(categoryId)) {
            showToast('Please fill in all required fields!', 'error');
            return;
        }

        // Konversi ke Mata Uang Dasar (USD) saat menyimpan
        const rate = conversionRates[currentCurrency];
        const baseAmount = displayAmount / rate; 
        
        const transactionData = {
            type,
            amount: baseAmount,
            date,
            categoryId,
            description,
            recurrence: recurrence,
            recurrenceEndDate: recurrenceEndDate
        };

        if (editingId) {
            const index = transactions.findIndex(t => t.id === editingId);
            if (index !== -1) {
                transactions[index] = { ...transactions[index], ...transactionData };
            }
        } else {
            transactions.push({ id: Date.now(), ...transactionData, isRecurring: (recurrence !== 'none') ? true : false, });
        }
        
        saveData();
        hideModal();
        updateAllViews();
        updateChart();
        showToast(editingId ? 'Transaction updated successfully!' : 'Transaction added successfully!');
    }
    
    function saveCategory() {
        const name = document.getElementById('category-name').value.trim();
        const type = document.getElementById('category-type').value;
        
        if (!name || !type) {
            showToast('Please complete the category name and type!', 'error');
            return;
        }
        
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type && c.id !== editingId)) {
            showToast('A category with this name and type already exists!', 'error');
            return;
        }
        
        if (editingId) {
            const index = categories.findIndex(c => c.id === editingId);
            if (index !== -1) {
                categories[index] = { ...categories[index], name, type };
            }
        } else {
            categories.push({ id: Date.now(), name, type });
        }
        
        saveData();
        hideModal();
        updateAllViews();
        showToast(editingId ? 'Category updated successfully!' : 'Category added successfully!');
    }

    // New Function: Save Budget
    function saveBudget() {
        const categoryId = parseInt(document.getElementById('budget-category').value);
        const displayLimit = parseFloat(document.getElementById('budget-limit').value);

        if (isNaN(categoryId) || isNaN(displayLimit)) {
            showToast('Please select a category and enter a valid limit!', 'error');
            return;
        }

        // Konversi ke Mata Uang Dasar (USD) saat menyimpan
        const rate = conversionRates[currentCurrency];
        const baseLimit = displayLimit / rate;

        if (editingId) {
            // Jika editingId diset, berarti kita sedang mengedit budget yang sudah ada
            const index = budgets.findIndex(b => b.categoryId === editingId);
            if (index !== -1) {
                budgets[index] = { ...budgets[index], limit: baseLimit };
            }
        } else {
            // Jika tidak, tambahkan yang baru
            budgets.push({ categoryId: categoryId, limit: baseLimit });
        }
        
        saveData();
        hideModal();
        updateAllViews();
        showToast(editingId ? 'Budget updated successfully!' : 'Budget set successfully!');
    }
    
    function saveMilestone() {
        const name = document.getElementById('milestone-name').value.trim();
        const displayTarget = parseFloat(document.getElementById('milestone-target').value);
        const date = document.getElementById('milestone-date').value;
        
        if (!name || isNaN(displayTarget) || !date) {
            showToast('Please fill in all target data!', 'error');
            return;
        }

        // Konversi ke Mata Uang Dasar (USD) saat menyimpan
        const rate = conversionRates[currentCurrency];
        const baseTarget = displayTarget / rate;
        
        if (editingId) {
            const index = milestones.findIndex(m => m.id === editingId);
            if (index !== -1) {
                milestones[index] = {
                    ...milestones[index],
                    name,
                    target: baseTarget,
                    date,
                };
            }
        } else {
            milestones.push({
                id: Date.now(),
                name,
                target: baseTarget,
                date,
                createdAt: new Date().toISOString()
            });
        }
        
        saveData();
        hideModal();
        updateAllViews();
        showToast(editingId ? 'Target updated successfully!' : 'Target added successfully!');
    }
    
    function saveData() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('milestones', JSON.stringify(milestones));
        localStorage.setItem('budgets', JSON.stringify(budgets));
    }

    // New Feature: Generate Recurring Transactions
    function generateRecurringTransactions() {
        const now = new Date();
        // Use a standard date format without time for comparison
        const todayStr = formatDate(now, 'iso'); 
        let shouldSave = false;
        
        // Filter out transactions marked as templates (isRecurring is used for old data)
        const recurringTemplates = transactions.filter(t => t.recurrence && t.recurrence !== 'none');

        recurringTemplates.forEach(template => {
            // Get last generated date. Use a copy of the template's date (which is YYYY-MM-DD)
            let lastDate = new Date(template.date + 'T00:00:00'); 
            
            // Check if there's a recurrence end date
            if (template.recurrenceEndDate) {
                const endDate = new Date(template.recurrenceEndDate + 'T00:00:00');
                if (lastDate >= endDate) {
                    template.recurrence = 'none';
                    shouldSave = true;
                    return; 
                }
            }

            // Loop and generate new transactions until today
            while (formatDate(lastDate, 'iso') < todayStr) {
                let nextDate = new Date(lastDate);

                if (template.recurrence === 'monthly') {
                    // Move to the same day next month
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (template.recurrence === 'weekly') {
                    // Move to the same day next week
                    nextDate.setDate(nextDate.getDate() + 7);
                }
                
                // If nextDate is still before or equal to today, and before end date
                if (formatDate(nextDate, 'iso') <= todayStr) {
                    let shouldGenerate = true;

                    if (template.recurrenceEndDate) {
                        const endDate = new Date(template.recurrenceEndDate + 'T00:00:00');
                        if (nextDate > endDate) {
                             template.recurrence = 'none'; // Stop recurrence
                             shouldSave = true;
                             shouldGenerate = false;
                        }
                    }
                    
                    if (shouldGenerate) {
                        // Add the new transaction (as a standard, non-recurring transaction)
                        transactions.push({
                            id: Date.now() + Math.random(),
                            type: template.type,
                            amount: template.amount,
                            date: formatDate(nextDate, 'iso'),
                            categoryId: template.categoryId,
                            description: `[${template.recurrence.toUpperCase()}] ${template.description || categories.find(c => c.id === template.categoryId)?.name || 'Recurring Transaction'}`,
                            // Ensure the generated transaction is not a template itself
                            recurrence: 'none' 
                        });

                        lastDate = nextDate;
                        shouldSave = true;
                    } else {
                        break; // Stop loop if end date reached
                    }
                } else {
                    break; // Stop loop if we passed today
                }
            }
            // Update the template's date to the last generated date for the next session
            template.date = formatDate(lastDate, 'iso');
        });
        
        if (shouldSave) {
            saveData();
        }
    }
    
    // Calculation functions (Bekerja dengan Mata Uang Dasar/USD)
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

    // New Function: Calculate Monthly Spending for Budgeting
    function calculateMonthlySpending(categoryId) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return transactions
            .filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return t.type === 'expense' &&
                       t.categoryId === categoryId &&
                       date.getFullYear() === currentYear &&
                       date.getMonth() === currentMonth;
            })
            .reduce((sum, t) => sum + t.amount, 0);
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
        
        categories.forEach(category => {
            categoryData[category.id] = {
                name: category.name,
                type: category.type,
                total: 0
            };
        });
        
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
        
        // Konversi nilai dasar ke mata uang tampilan
        document.getElementById('total-saldo').textContent = formatCurrency(totalBalance);
        document.getElementById('total-pemasukan').textContent = formatCurrency(totalIncome);
        document.getElementById('total-pengeluaran').textContent = formatCurrency(totalExpense);
        
        updateRecentTransactions();
        updateChart(); // Selalu update chart dashboard
    }

    // New Function: Update Budget Table
    function updateBudgetTable() {
        const tableBody = DOMElements.budgetsTableBody;
        tableBody.innerHTML = '';

        if (budgets.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-cell">
                        <i class="fas fa-money-check-alt"></i>
                        <p>No budgets set yet.</p>
                        <small>Try setting a new monthly limit for an expense category!</small>
                    </td>
                </tr>`;
            return;
        }

        const tableHTML = budgets.map(budget => {
            const category = categories.find(c => c.id === budget.categoryId);
            const categoryName = category ? category.name : 'Deleted Category';
            
            const spent = calculateMonthlySpending(budget.categoryId);
            const remaining = budget.limit - spent;
            const progress = budget.limit > 0 ? Math.min(Math.round((spent / budget.limit) * 100), 1000) : 0; // Max 1000% just in case
            
            let progressClass = '';
            if (progress >= 100) {
                progressClass = 'danger';
            } else if (progress >= 80) {
                progressClass = 'warning';
            }

            const progressBar = `
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <small class="${progress >= 100 ? 'expense-color' : 'text-primary'}">${progress.toFixed(0)}% Used</small>
            `;

            return `
                <tr>
                    <td data-label="Category">${categoryName}</td>
                    <td data-label="Monthly Limit">${formatCurrency(budget.limit)}</td>
                    <td data-label="Spent This Month" class="${spent > budget.limit ? 'expense-color' : 'income-color'}">${formatCurrency(spent)}</td>
                    <td data-label="Progress">${progressBar}</td>
                    <td data-label="Remaining" class="${remaining < 0 ? 'expense-color' : 'income-color'}">${formatCurrency(remaining)}</td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="edit-btn" data-id="${budget.categoryId}"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" data-id="${budget.categoryId}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableHTML;
    }
    
    function updateRecentTransactions() {
        const recentTransactionsContainer = document.getElementById('recent-transactions');
        recentTransactionsContainer.innerHTML = '';
        
        const recentTransactions = [...transactions]
            .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'))
            .slice(0, 5);
        
        // *** FITUR BARU: Empty State Dashboard yang Lebih Baik ***
        if (recentTransactions.length === 0) {
            recentTransactionsContainer.innerHTML = `
            <div class="empty-state-card">
                <i class="fas fa-magic"></i>
                <h4>No transactions yet!</h4>
                <p>Add your first transaction to see it here.</p>
                <button id="dashboard-add-btn" class="btn-primary"><i class="fas fa-plus"></i> Add First Transaction</button>
            </div>`;
            // Tambahkan event listener untuk tombol baru ini
            document.getElementById('dashboard-add-btn').addEventListener('click', () => {
                DOMElements.addTransactionBtn.click(); // Simulasikan klik pada tombol utama
            });
            return;
        }
        
        recentTransactions.forEach(transaction => {
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            
            const iconClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountClass = iconClass;
            const formattedDate = formatDate(transaction.date);

            const category = categories.find(c => c.id === transaction.categoryId);
            const categoryName = category ? category.name : 'Deleted Category';
            
            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fas fa-${transaction.type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${categoryName}</h4> 
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
        const tableBody = DOMElements.transactionsTableBody;
        tableBody.innerHTML = '';

        // *** LOGIKA FILTER DENGAN DOMElements ***
        const type = DOMElements.filterType.value;
        const startDate = DOMElements.filterStartDate.value;
        const endDate = DOMElements.filterEndDate.value;
        
        let filteredTransactions = [...transactions];

        if (type !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === type);
        }
        if (startDate) {
            // Menggunakan T00:00:00 untuk mengatasi perbedaan zona waktu
            const start = new Date(startDate + 'T00:00:00');
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date + 'T00:00:00') >= start);
        }
        if (endDate) {
            const end = new Date(endDate + 'T00:00:00');
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date + 'T00:00:00') <= end);
        }
        // *** AKHIR LOGIKA FILTER ***

        const sortedTransactions = filteredTransactions.sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
        
        if (sortedTransactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state-cell">
                        <i class="fas fa-search-dollar"></i>
                        <p>No transactions found.</p>
                        <small>Try adjusting your filters or adding a new transaction!</small>
                    </td>
                </tr>`;
            return;
        }
        
        // --- MODERNISASI RENDERING TABEL DENGAN MAP & JOIN ---
        const tableHTML = sortedTransactions.map(transaction => {
            const formattedDate = formatDate(transaction.date);
            const rowClass = transaction.type === 'income' ? 'income-row' : 'expense-row';
            const category = categories.find(c => c.id === transaction.categoryId);
            const categoryName = category ? category.name : 'Deleted Category';
            const amountDisplay = `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`;
            const descriptionDisplay = transaction.description || '-';

            return `
                <tr class="${rowClass}">
                    <td data-label="Date">${formattedDate}</td>
                    <td data-label="Category">${categoryName}</td>
                    <td data-label="Description">${descriptionDisplay}</td>
                    <td data-label="Amount">${amountDisplay}</td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="edit-btn" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableHTML;
    }
    
    function editTransaction(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        editingId = id;
        DOMElements.transactionModalTitle.textContent = 'Edit Transaction';
        document.getElementById('transaction-type').value = transaction.type;
        
        // Konversi nilai dasar (USD) ke mata uang tampilan untuk form
        const rate = conversionRates[currentCurrency];
        const displayAmount = transaction.amount * rate;
        document.getElementById('transaction-amount').value = displayAmount.toFixed(currentCurrency === 'IDR' ? 0 : 2);
        
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-description').value = transaction.description || '';
        
        // New Feature: Recurrence fields
        DOMElements.transactionRecurrenceSelect.value = transaction.recurrence || 'none';
        if (transaction.recurrenceEndDate) {
            document.getElementById('recurrence-end-date').value = transaction.recurrenceEndDate;
            DOMElements.recurrenceEndGroup.classList.remove('hidden');
        } else {
            document.getElementById('recurrence-end-date').value = '';
            DOMElements.recurrenceEndGroup.classList.add('hidden');
        }

        updateCategoryDropdown(transaction.type);
        setTimeout(() => {
            document.getElementById('transaction-category').value = transaction.categoryId;
            showModal('transaction');
        }, 50);
    }
    
    function deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateAllViews();
            showToast('Transaction deleted successfully.');
        }
    }

    // New Function: Edit Budget (uses categoryId as ID)
    function editBudget(categoryId) {
        const budget = budgets.find(b => b.categoryId === categoryId);
        if (!budget) return;

        editingId = categoryId; // Use categoryId as editing ID for budget
        DOMElements.budgetModalTitle.textContent = 'Edit Budget Limit';

        updateBudgetDropdown(); // Update dropdown (will show only the category being edited + available ones)

        // Konversi nilai dasar (USD) ke mata uang tampilan untuk form
        const rate = conversionRates[currentCurrency];
        const displayLimit = budget.limit * rate;
        
        // Set values
        document.getElementById('budget-category').value = categoryId;
        document.getElementById('budget-limit').value = displayLimit.toFixed(currentCurrency === 'IDR' ? 0 : 2);
        // Disable category select during edit
        document.getElementById('budget-category').disabled = true;

        showModal('budget');
    }

    // New Function: Delete Budget (uses categoryId as ID)
    function deleteBudget(categoryId) {
        if (confirm('Are you sure you want to delete this budget limit?')) {
            budgets = budgets.filter(b => b.categoryId !== categoryId);
            saveData();
            updateAllViews();
            showToast('Budget deleted successfully.');
        }
    }
    
    function updateCategoryTable() {
        const tableBody = DOMElements.categoriesTableBody;
        tableBody.innerHTML = '';
        
        if (categories.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-state-cell">
                        <i class="fas fa-tags"></i>
                        <p>No categories yet.</p>
                        <small>Try adding a new category!</small>
                    </td>
                </tr>`;
            return;
        }
        
        const tableHTML = categories.map(category => {
            return `
                <tr>
                    <td data-label="Name">${category.name}</td>
                    <td data-label="Type">${category.type === 'income' ? 'Income' : 'Expense'}</td> 
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="edit-btn" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = tableHTML;
    }
    
    function editCategory(id) {
        const category = categories.find(c => c.id === id);
        if (!category) return;
        
        editingId = id;
        DOMElements.categoryModalTitle.textContent = 'Edit Category';
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-type').value = category.type;
        showModal('category');
    }
    
    function deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            const isUsed = transactions.some(t => t.categoryId === id);
            const isBudgeted = budgets.some(b => b.categoryId === id);
            if (isUsed) {
                showToast('Category cannot be deleted as it is used in transactions.', 'error');
                return;
            }
             if (isBudgeted) {
                showToast('Category cannot be deleted as it has an active budget.', 'error');
                return;
            }
            categories = categories.filter(c => c.id !== id);
            saveData();
            updateAllViews();
            showToast('Category deleted successfully.');
        }
    }
    
    function updateMilestoneTable() {
        const tableBody = DOMElements.milestoneTableBody;
        tableBody.innerHTML = '';
        
        if (milestones.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-cell">
                        <i class="fas fa-bullseye"></i>
                        <p>No targets yet.</p>
                        <small>Try adding a new target!</small>
                    </td>
                </tr>`;
            return;
        }
        
        const totalBalance = calculateTotalBalance(); // Ini dalam USD
        
        const tableHTML = milestones.map(milestone => {
            const savedInBase = Math.min(totalBalance, milestone.target);
            const progress = milestone.target > 0 ? Math.min(Math.round((savedInBase / milestone.target) * 100), 100) : 0;
            const progressBar = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <small>${progress}%</small>
            `;
            
            return `
                <tr>
                    <td data-label="Target Name">${milestone.name}</td>
                    <td data-label="Target Amount">${formatCurrency(milestone.target)}</td> 
                    <td data-label="Current Balance">${formatCurrency(savedInBase)}</td> 
                    <td data-label="Progress">${progressBar}</td>
                    <td data-label="Target Date">${formatDate(milestone.date)}</td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="edit-btn" data-id="${milestone.id}"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" data-id="${milestone.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = tableHTML;
    }
    
    function editMilestone(id) {
        const milestone = milestones.find(m => m.id === id);
        if (!milestone) return;
        
        editingId = id;
        DOMElements.milestoneModalTitle.textContent = 'Edit Target';
        document.getElementById('milestone-name').value = milestone.name;
        
        // Konversi nilai dasar (USD) ke mata uang tampilan untuk form
        const rate = conversionRates[currentCurrency];
        const displayTarget = milestone.target * rate;
        document.getElementById('milestone-target').value = displayTarget.toFixed(currentCurrency === 'IDR' ? 0 : 2);

        document.getElementById('milestone-date').value = milestone.date;
        showModal('milestone');
    }
    
    function deleteMilestone(id) {
        if (confirm('Are you sure you want to delete this target?')) {
            milestones = milestones.filter(m => m.id !== id);
            saveData();
            updateAllViews();
            showToast('Target deleted successfully.');
        }
    }
    
    // Chart functions
    function initYearSelectors() {
        const currentYear = new Date().getFullYear();
        let years = [];
        
        transactions.forEach(transaction => {
            const year = new Date(transaction.date).getFullYear();
            if (!years.includes(year)) {
                years.push(year);
            }
        });
        
        if (years.length === 0 || !years.includes(currentYear)) {
            years.push(currentYear);
        }
        
        years.sort((a, b) => b - a);
        
        DOMElements.reportYearSelector.innerHTML = '';
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            DOMElements.reportYearSelector.appendChild(option);
        });
        
        DOMElements.reportYearSelector.value = currentYear;
    }
    
    function updateChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');

        const computedStyles = getComputedStyle(document.documentElement);
        const titleColor = computedStyles.getPropertyValue('--text-secondary').trim();
        const legendColor = computedStyles.getPropertyValue('--text-primary').trim();
        const borderColor = computedStyles.getPropertyValue('--card-bg').trim();
        
        if (monthlyChart) {
            monthlyChart.destroy();
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const categoryData = {};
        const labels = [];
        const data = [];
        const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#c0392b'];

        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date + 'T00:00:00');

            if (transaction.type === 'expense' &&
                transactionDate.getFullYear() === currentYear &&
                transactionDate.getMonth() === currentMonth) {
                
                const category = categories.find(c => c.id === transaction.categoryId);
                const categoryName = category ? category.name : 'Other';

                if (!categoryData[categoryName]) {
                    categoryData[categoryName] = 0;
                }
                categoryData[categoryName] += transaction.amount; // amount is in USD
            }
        });

        for (const [key, value] of Object.entries(categoryData)) {
            if (value > 0) {
                labels.push(key);
                data.push(value);
            }
        }
        
        let titleText = `Expenses This Month (${now.toLocaleString('en-US', { month: 'long' })})`;
        if (data.length === 0) {
            titleText = 'No expenses recorded this month';
        }

        monthlyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Expense',
                        data: data, // Data dalam USD
                        backgroundColor: colors,
                        borderColor: borderColor, 
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: legendColor 
                        }
                    },
                    title: {
                        display: true,
                        text: titleText,
                        color: titleColor, 
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatCurrency(context.raw); // Konversi ke mata uang tampilan
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function updateReportChart() {
        const selectedYear = parseInt(DOMElements.reportYearSelector.value) || new Date().getFullYear();
        const reportType = DOMElements.reportTypeSelector.value;
        
        const ctx = document.getElementById('reportChart').getContext('2d');
        
        if (reportChart) {
            reportChart.destroy();
        }
        
        const computedStyles = getComputedStyle(document.documentElement);
        const titleColor = computedStyles.getPropertyValue('--text-primary').trim();
        const gridColor = computedStyles.getPropertyValue('--border-color').trim();
        const legendColor = computedStyles.getPropertyValue('--text-primary').trim();

        if (reportType === 'monthly') {
            const { monthlyIncome, monthlyExpense } = getMonthlyData(selectedYear);
            
            reportChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                        {
                            label: 'Income',
                            data: monthlyIncome,
                            backgroundColor: 'rgba(46, 204, 113, 0.2)',
                            borderColor: '#2ecc71',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Expense',
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
                            ticks: { callback: (value) => formatCurrency(value), color: titleColor },
                            grid: { color: gridColor }
                        },
                         x: {
                            ticks: { color: titleColor },
                            grid: { color: gridColor }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: legendColor } },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
                            }
                        }
                    }
                }
            });
            
            updateMonthlyReportSummary(selectedYear, monthlyIncome, monthlyExpense);
        } else {
            const categoryData = getCategoryData(selectedYear);
            const expenseCategories = [];
            const expenseData = [];
            
            for (const id in categoryData) {
                const category = categoryData[id];
                if (category.type === 'expense' && category.total > 0) {
                    expenseCategories.push(category.name);
                    expenseData.push(category.total);
                }
            }
            
            reportChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: expenseCategories,
                    datasets: [
                        {
                            label: 'Expense',
                            data: expenseData,
                            backgroundColor: [
                                '#e74c3c', '#c0392b', '#e67e22', '#d35400', '#f1c40f', '#f39c12',
                                '#9b59b6', '#8e44ad', '#3498db', '#2980b9'
                            ],
                            borderColor: computedStyles.getPropertyValue('--card-bg').trim(),
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: legendColor } },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.label}: ${formatCurrency(context.raw)}`
                            }
                        }
                    }
                }
            });
            
            updateCategoryReportSummary(selectedYear, categoryData);
        }
    }
    
    // Fungsi Ringkasan (Bekerja dengan data USD, memformat untuk tampilan)
    function updateMonthlyReportSummary(year, monthlyIncome, monthlyExpense) {
        const reportSummary = document.getElementById('report-summary');
        
        const totalIncome = monthlyIncome.reduce((sum, val) => sum + val, 0);
        const totalExpense = monthlyExpense.reduce((sum, val) => sum + val, 0);
        const netIncome = totalIncome - totalExpense;
        
        const highestIncomeMonth = monthlyIncome.indexOf(Math.max(...monthlyIncome));
        const highestExpenseMonth = monthlyExpense.indexOf(Math.max(...monthlyExpense));
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        reportSummary.innerHTML = `
            <h3>Report Summary ${year}</h3>
            <div class="report-summary-item">
                <h4>Total Income</h4>
                <p>${formatCurrency(totalIncome)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Total Expense</h4>
                <p>${formatCurrency(totalExpense)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Net Balance</h4>
                <p class="${netIncome >= 0 ? 'income-color' : 'expense-color'}">${formatCurrency(netIncome)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Highest Income Month</h4>
                <p>${totalIncome > 0 ? monthNames[highestIncomeMonth] : '-'}: ${formatCurrency(monthlyIncome[highestIncomeMonth])}</p>
            </div>
            <div class="report-summary-item">
                <h4>Highest Expense Month</h4>
                <p>${totalExpense > 0 ? monthNames[highestExpenseMonth] : '-'}: ${formatCurrency(monthlyExpense[highestExpenseMonth])}</p>
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
                incomeCategories.push({ name: category.name, total: category.total });
                totalIncome += category.total;
            } else if (category.type === 'expense' && category.total > 0) {
                expenseCategories.push({ name: category.name, total: category.total });
                totalExpense += category.total;
            }
        }
        
        incomeCategories.sort((a, b) => b.total - a.total);
        expenseCategories.sort((a, b) => b.total - a.total);
        
        let incomeHTML = '<h5>Top Income</h5>';
        if (incomeCategories.length > 0) {
            incomeCategories.forEach(cat => {
                incomeHTML += `
                    <div class="report-summary-item">
                        <h4>${cat.name}</h4>
                        <p>${formatCurrency(cat.total)} (${totalIncome > 0 ? Math.round((cat.total / totalIncome) * 100) : 0}%)</p>
                    </div>
                `;
            });
        } else {
            incomeHTML += '<p><small>No income data.</small></p>';
        }
        
        let expenseHTML = '<h5>Top Expenses</h5>';
         if (expenseCategories.length > 0) {
            expenseCategories.forEach(cat => {
                expenseHTML += `
                    <div class="report-summary-item">
                        <h4>${cat.name}</h4>
                        <p>${formatCurrency(cat.total)} (${totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0}%)</p>
                    </div>
                `;
            });
        } else {
             expenseHTML += '<p><small>No expense data.</small></p>';
        }

        const netIncome = totalIncome - totalExpense;
        
        reportSummary.innerHTML = `
            <h3>Category Summary ${year}</h3>
            <div class="report-summary-item">
                <h4>Total Income</h4>
                <p>${formatCurrency(totalIncome)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Total Expense</h4>
                <p>${formatCurrency(totalExpense)}</p>
            </div>
            <div class="report-summary-item">
                <h4>Net Balance</h4>
                <p class="${netIncome >= 0 ? 'income-color' : 'expense-color'}">${formatCurrency(netIncome)}</p>
            </div>
            ${expenseHTML}
            ${incomeHTML}
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
        
        let recommendations = [];
        
        if (totalIncome > 0 || totalExpense > 0) {
            if (savingsRate < 20) {
                recommendations.push({
                    title: 'Improve Your Savings',
                    message: `Your current savings rate is ${savingsRate.toFixed(1)}%. It's recommended to save at least 20% of your income. Consider cutting down on non-essential expenses.`
                });
            } else {
                recommendations.push({
                    title: 'Great Savings!',
                    message: `Congratulations! Your savings rate is ${savingsRate.toFixed(1)}% of your income. Keep up the good habit.`
                });
            }
        }
        
        const expenseCategories = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const category = categories.find(c => c.id === t.categoryId);
                const categoryName = category ? category.name : 'Other';
                
                if (!expenseCategories[categoryName]) {
                    expenseCategories[categoryName] = 0;
                }
                expenseCategories[categoryName] += t.amount;
            });
        
        let highestExpenseCat = '';
        let highestExpenseAmount = 0;
        for (const cat in expenseCategories) {
            if (expenseCategories[cat] > highestExpenseAmount) {
                highestExpenseAmount = expenseCategories[cat];
                highestExpenseCat = cat;
            }
        }
        
        if (totalExpense > 0 && highestExpenseAmount > totalExpense * 0.3) {
            recommendations.push({
                title: 'Dominant Expense',
                message: `The "${highestExpenseCat}" category accounts for ${Math.round((highestExpenseAmount / totalExpense) * 100)}% of your total spending. Consider reviewing these expenses.`
            });
        }
        
        const totalBalance = calculateTotalBalance();
        milestones.forEach(milestone => {
            const saved = Math.min(totalBalance, milestone.target);
            const progress = milestone.target > 0 ? (saved / milestone.target) * 100 : 0;
            const daysLeft = Math.ceil((new Date(milestone.date) - new Date()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft > 0 && daysLeft < 30 && progress < 50) {
                const dailyNeeded = (milestone.target - saved) / daysLeft;
                recommendations.push({
                    title: 'Target Nearing Deadline',
                    message: `Your target "${milestone.name}" is only ${progress.toFixed(0)}% complete with ${daysLeft} days left. You need to save ${formatCurrency(dailyNeeded)} per day to reach it.`
                });
            }
        });

        // New Feature: Budget Recommendation
        budgets.forEach(budget => {
            const spent = calculateMonthlySpending(budget.categoryId);
            const category = categories.find(c => c.id === budget.categoryId);
            const categoryName = category ? category.name : 'Deleted Category';

            if (spent > budget.limit) {
                 recommendations.push({
                    title: `Over Budget: ${categoryName}`,
                    message: `You have exceeded your monthly limit for ${categoryName} by ${formatCurrency(spent - budget.limit)}. Review your recent spending.`
                });
            } else if (spent / budget.limit >= 0.9) {
                 recommendations.push({
                    title: `Near Budget Limit: ${categoryName}`,
                    message: `You have used ${formatCurrency(spent)} for ${categoryName}, which is close to your limit of ${formatCurrency(budget.limit)}. Be mindful of further spending.`
                });
            }
        });
        
        if (recommendations.length === 0) {
            recommendations.push({
                title: 'Stay Consistent',
                message: 'Your finances seem to be in good order. Keep up the habit of tracking your transactions and reviewing your spending regularly.'
            });
        }
        
        recommendations.slice(0, 3).forEach(rec => {
            const recEl = document.createElement('div');
            recEl.className = 'recommendation-card';
            recEl.innerHTML = `
                <h3>${rec.title}</h3>
                <p>${rec.message}</p>
            `;
            recommendationsContainer.appendChild(recEl);
        });
    }

    // New Function: Export to CSV
    function exportToCsv() {
        if (transactions.length === 0) {
            showToast('No transactions to export!', 'error');
            return;
        }

        const header = ["Date", "Type", "Category", "Amount_USD", "Amount_Current", "Currency", "Description", "Recurrence", "End_Date"];
        
        const csvRows = transactions.map(t => {
            const category = categories.find(c => c.id === t.categoryId);
            const categoryName = category ? category.name : 'N/A';
            // Get amount without currency symbol for CSV
            const convertedAmount = formatCurrency(t.amount).replace(/[^0-9.,-]/g, '').trim(); 
            
            return [
                `"${t.date}"`,
                `"${t.type}"`,
                `"${categoryName}"`,
                `"${t.amount.toFixed(2)}"`,
                `"${convertedAmount}"`,
                `"${currentCurrency}"`,
                `"${t.description ? t.description.replace(/"/g, '""') : ''}"`,
                `"${t.recurrence || 'none'}"`,
                `"${t.recurrenceEndDate || ''}"`
            ].join(',');
        });

        const csvContent = [header.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `MyTrack_Transactions_${formatDate(new Date(), 'iso')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV Exported Successfully!');
    }
    
    // Export functions (VERSI DARK MODE DAN AESTETIK DENGAN FONT TEBAL)
    function exportToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4'); 
        
        const selectedYear = DOMElements.reportYearSelector.value;
        const title = `Financial Report ${selectedYear}`;

        // ----------------------------------------------------
        // 1. PENGATURAN TEMA DASAR (DARK MODE)
        // ----------------------------------------------------
        const BG_COLOR = '#121212'; // Latar Belakang Hitam Gelap
        const TEXT_PRIMARY = '#ecf0f1'; // Teks Putih Primer
        const TEXT_SECONDARY = '#bdc3c7'; // Teks Abu-abu Terang
        const PRIMARY_COLOR = '#5d8acd'; // Warna Biru Primer untuk Aksen
        const BORDER_COLOR = '#444444'; // Warna Border Gelap

        // Isi seluruh halaman dengan warna latar belakang gelap
        doc.setFillColor(BG_COLOR);
        doc.rect(0, 0, 210, 297, 'F'); 

        
        // --- TAMPILAN HEADER YANG LEBIH BAIK ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(PRIMARY_COLOR); // Warna biru primer untuk judul utama
        doc.text("MyTrack Financial Report", 105, 18, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(TEXT_PRIMARY); // Teks Putih
        doc.text(title, 105, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(TEXT_SECONDARY); // Teks Abu-abu Terang
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 32, { align: 'center' });
        
        // Tambahkan garis pemisah
        doc.setDrawColor(BORDER_COLOR);
        doc.line(15, 35, 195, 35);
        
        let currentY = 40;
        
        // --- CHART (Gambar) ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(TEXT_PRIMARY);
        doc.text("1. Monthly/Category Overview Chart", 15, currentY);
        currentY += 5;

        const chartCanvas = document.getElementById('reportChart');
        if (reportChart) reportChart.resize(); 

        const chartImage = chartCanvas.toDataURL('image/png', 1.0);
        doc.addImage(chartImage, 'PNG', 15, currentY, 180, 80);
        currentY += 85;

        // --- RINGKASAN (Menggunakan AutoTable untuk Tampilan Estetik) ---
        doc.setFontSize(14);
        doc.setTextColor(TEXT_PRIMARY);
        doc.text('2. Report Summary', 15, currentY);
        currentY += 5;

        const summary = document.getElementById('report-summary');
        
        // Ambil data Total Summary (3 baris teratas: Income, Expense, Net Balance)
        const summaryItems = summary.querySelectorAll('.report-summary-item');
        const summaryData = [];
        
        for (let i = 0; i < Math.min(3, summaryItems.length); i++) {
             const h4 = summaryItems[i].querySelector('h4').innerText;
             const p = summaryItems[i].querySelector('p').innerText;
             summaryData.push([h4, p]);
        }
        
        doc.autoTable({
            startY: currentY,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid', 
            columnStyles: {
                // Kolom 0 (Metric) sudah bold, biarkan.
                0: { fontStyle: 'bold', cellWidth: 50 }, 
                // Kolom 1 (Value) kita buat bold juga
                1: { fontStyle: 'bold', cellWidth: 'auto', halign: 'right' }
            },
            styles: { 
                fontSize: 10,
                cellPadding: 2,
                textColor: TEXT_PRIMARY, 
                fillColor: BG_COLOR, 
                lineColor: BORDER_COLOR, 
                lineWidth: 0.1
            },
            headStyles: { 
                fillColor: PRIMARY_COLOR, 
                textColor: 255, 
                fontStyle: 'bold'
            },
            didDrawCell: (data) => {
                // Menandai Net Balance dengan warna yang kontras di tema gelap
                if (data.section === 'body' && data.row.index === 2) { 
                    const isPositive = data.row.raw[1].includes('+') || !data.row.raw[1].includes('-');
                    if (data.column.index === 1) {
                         doc.setFillColor(isPositive ? '#1b5e20' : '#b71c1c'); 
                         doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                         doc.setTextColor(isPositive ? '#c8e6c9' : '#ffcdd2'); 
                         doc.text(data.cell.text[0], data.cell.x + data.cell.width - data.cell.padding('right'), data.cell.y + data.cell.height / 2, { align: 'right', baseline: 'middle' });
                         return false; 
                    }
                }
            }
        });
        currentY = doc.lastAutoTable.finalY + 10;
        
        // --- TRANSAKSI (Tabel) ---
        doc.setFontSize(14);
        doc.setTextColor(TEXT_PRIMARY);
        doc.text(`3. Transaction List (${selectedYear})`, 15, currentY);
        currentY += 5;

        const tableTransactions = transactions
            .filter(t => new Date(t.date).getFullYear() == selectedYear)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const head = [['Date', 'Category', 'Description', 'Type', 'Amount']];
        const body = tableTransactions.map(t => {
            const category = categories.find(c => c.id === t.categoryId);
            const categoryName = category ? category.name : 'N/A';
            return [
                formatDate(t.date),
                categoryName,
                t.description || '-',
                t.type === 'income' ? 'Income' : 'Expense',
                formatCurrency(t.amount).replace(/^-|\+/g, '') 
            ];
        });

        if (body.length > 0) {
            doc.autoTable({
                startY: currentY,
                head: head,
                body: body,
                theme: 'grid', 
                styles: { 
                    fontSize: 8,
                    cellPadding: 1.5,
                    textColor: TEXT_SECONDARY, 
                    fillColor: BG_COLOR, 
                    lineColor: BORDER_COLOR,
                    lineWidth: 0.1,
                    fontStyle: 'bold' 
                },
                headStyles: { 
                    fillColor: PRIMARY_COLOR, 
                    textColor: 255, 
                    fontStyle: 'bold'
                },
                columnStyles: {
                    4: { halign: 'right' } 
                },
                didDrawCell: (data) => {
                    // Beri warna teks kontras pada kolom Type dan Amount
                    if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
                        const type = data.row.raw[3]; 
                        if (type === 'Income') {
                            doc.setTextColor('#66bb6a'); 
                        } else if (type === 'Expense') {
                            doc.setTextColor('#ff5252'); 
                        }
                    } else if (data.section === 'body' && data.column.index < 3) {
                         doc.setTextColor(TEXT_PRIMARY); 
                    }
                }
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(TEXT_SECONDARY);
            doc.text('No transaction data for this year.', 15, currentY);
        }

        doc.save(`Financial Report ${selectedYear}_DarkMode_Bold.pdf`);
        showToast('PDF Exported Successfully with Dark Mode and Bold Text!');
    }
    
    // *** FUNGSI DIPERBARUI: formatCurrency ***
    function formatCurrency(amountInBase) {
        if (isNaN(amountInBase)) amountInBase = 0;

        const rate = conversionRates[currentCurrency];
        const convertedAmount = amountInBase * rate;

        const options = {
            style: 'currency',
            currency: currentCurrency,
        };

        let locale = 'en-US'; 

        if (currentCurrency === 'IDR') {
            locale = 'id-ID';
            options.minimumFractionDigits = 0;
            options.maximumFractionDigits = 0;
        } else if (currentCurrency === 'SGD') {
            locale = 'en-SG';
            options.minimumFractionDigits = 2;
            options.maximumFractionDigits = 2;
        } else if (currentCurrency === 'USD') {
            locale = 'en-US';
            options.minimumFractionDigits = 2;
            options.maximumFractionDigits = 2;
        }

        return new Intl.NumberFormat(locale, options).format(convertedAmount);
    }
    
    // FUNGSI DIPERBARUI: formatDate
    function formatDate(dateStr, format = 'local') {
        if (!dateStr) return '-';
        
        let date;
        if (typeof dateStr === 'object') {
            date = dateStr;
        } else {
            // Mengubah format YYYY-MM-DD menjadi ISO string lokal (YYYY-MM-DDT00:00:00)
            date = new Date(dateStr + 'T00:00:00'); 
        }

        if (isNaN(date.getTime())) return '-';
        
        if (format === 'iso') {
             return date.toISOString().split('T')[0];
        }

        // Menggunakan locale 'en-GB' untuk format DD/MM/YYYY
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Fungsi Notifikasi Toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === document.body) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
});