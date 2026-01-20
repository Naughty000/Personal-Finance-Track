const { useState, useEffect, useRef } = React;

const FinanceTracker = () => {
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState(5000);
    const [newTransaction, setNewTransaction] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
    });
    const [filter, setFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [notification, setNotification] = useState(null);
    
    const incomeChartRef = useRef(null);
    const expenseChartRef = useRef(null);
    const budgetChartRef = useRef(null);
    const categoryChartRef = useRef(null);
    
    const categories = {
        income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other Income'],
        expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other']
    };
    
    useEffect(() => {
        const savedData = localStorage.getItem('personalFinanceData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                setTransactions(data.transactions || []);
                setMonthlyBudget(data.monthlyBudget || 5000);
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }, []);
    
    useEffect(() => {
        let income = 0;
        let expenses = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                income += parseFloat(transaction.amount);
            } else {
                expenses += parseFloat(transaction.amount);
            }
        });
        
        setTotalIncome(income);
        setTotalExpenses(expenses);
        setBalance(income - expenses);
        
        const financeData = {
            transactions,
            monthlyBudget
        };
        localStorage.setItem('personalFinanceData', JSON.stringify(financeData));
        
        if (transactions.length > 0) {
            createCharts();
        }
    }, [transactions, monthlyBudget]);
    
    const createCharts = () => {
        const incomeByMonth = {};
        const expenseByMonth = {};
        const expensesByCategory = {};
        
        transactions.forEach(t => {
            const date = new Date(t.date);
            const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (t.type === 'income') {
                incomeByMonth[month] = (incomeByMonth[month] || 0) + parseFloat(t.amount);
            } else {
                expenseByMonth[month] = (expenseByMonth[month] || 0) + parseFloat(t.amount);
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + parseFloat(t.amount);
            }
        });
        
        const months = Array.from(new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])).sort();
        
        const incomeData = months.map(month => incomeByMonth[month] || 0);
        const expenseData = months.map(month => expenseByMonth[month] || 0);
        
        if (incomeChartRef.current) {
            const existingChart = Chart.getChart(incomeChartRef.current);
            if (existingChart) existingChart.destroy();
            
            new Chart(incomeChartRef.current.getContext('2d'), {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { callback: value => `$${value}` }
                        }
                    }
                }
            });
        }
        
        if (expenseChartRef.current) {
            const existingChart = Chart.getChart(expenseChartRef.current);
            if (existingChart) existingChart.destroy();
            
            new Chart(expenseChartRef.current.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: '#ef4444',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { callback: value => `$${value}` }
                        }
                    }
                }
            });
        }
        
        if (budgetChartRef.current) {
            const existingChart = Chart.getChart(budgetChartRef.current);
            if (existingChart) existingChart.destroy();
            
            new Chart(budgetChartRef.current.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Spent', 'Remaining'],
                    datasets: [{
                        data: [totalExpenses, Math.max(0, monthlyBudget - totalExpenses)],
                        backgroundColor: ['#ef4444', '#10b981'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
        
        if (categoryChartRef.current && Object.keys(expensesByCategory).length > 0) {
            const existingChart = Chart.getChart(categoryChartRef.current);
            if (existingChart) existingChart.destroy();
            
            const categoryLabels = Object.keys(expensesByCategory);
            const categoryData = Object.values(expensesByCategory);
            
            new Chart(categoryChartRef.current.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        data: categoryData,
                        backgroundColor: [
                            '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                            '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'right' } }
                }
            });
        }
    };
    
    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };
    
    const handleAddTransaction = (e) => {
        e.preventDefault();
        
        if (!newTransaction.title.trim() || !newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
            showNotification('error', 'Please fill all fields with valid data');
            return;
        }
        
        const transaction = {
            id: editingId || Date.now(),
            ...newTransaction,
            amount: parseFloat(newTransaction.amount),
            date: newTransaction.date || new Date().toISOString().split('T')[0]
        };
        
        if (editingId) {
            setTransactions(prev => prev.map(t => t.id === editingId ? transaction : t));
            showNotification('success', 'Transaction updated successfully');
        } else {
            setTransactions(prev => [transaction, ...prev]);
            showNotification('success', 'Transaction added successfully');
        }
        
        setNewTransaction({
            title: '',
            amount: '',
            type: 'expense',
            category: 'Food',
            date: new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
    };
    
    const handleDeleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        showNotification('info', 'Transaction deleted');
    };
    
    const handleEditTransaction = (transaction) => {
        setNewTransaction({
            title: transaction.title,
            amount: transaction.amount.toString(),
            type: transaction.type,
            category: transaction.category,
            date: transaction.date
        });
        setEditingId(transaction.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleExportData = () => {
        const dataStr = JSON.stringify({
            transactions,
            monthlyBudget,
            summary: { balance, totalIncome, totalExpenses }
        }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'finance-data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('success', 'Data exported successfully');
    };
    
    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                setTransactions(data.transactions || []);
                setMonthlyBudget(data.monthlyBudget || 5000);
                showNotification('success', 'Data imported successfully');
            } catch (error) {
                showNotification('error', 'Invalid file format');
            }
        };
        reader.readAsText(file);
    };
    
    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'income') return t.type === 'income';
        if (filter === 'expense') return t.type === 'expense';
        return t.category === filter;
    });
    
    return (
        <div className="finance-container min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Personal Finance Tracker
                </h1>
                <p className="text-gray-600 text-lg">
                    Manage your finances with interactive charts and budget planning
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        <i className="fab fa-react mr-1"></i>React.js
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <i className="fas fa-chart-line mr-1"></i>Chart.js
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        <i className="fab fa-css3-alt mr-1"></i>Tailwind CSS
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        <i className="fas fa-database mr-1"></i>Local Storage
                    </span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="balance-card stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm opacity-90">Current Balance</p>
                            <p className="text-2xl md:text-3xl font-bold">${balance.toFixed(2)}</p>
                        </div>
                        <div className="text-2xl">
                            <i className="fas fa-wallet"></i>
                        </div>
                    </div>
                    <p className="text-sm opacity-90">
                        {balance >= 0 ? 'You are doing great!' : 'Consider reducing expenses'}
                    </p>
                </div>
                
                <div className="income-card stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm opacity-90">Total Income</p>
                            <p className="text-2xl md:text-3xl font-bold">${totalIncome.toFixed(2)}</p>
                        </div>
                        <div className="text-2xl">
                            <i className="fas fa-arrow-up"></i>
                        </div>
                    </div>
                    <p className="text-sm opacity-90">
                        {transactions.filter(t => t.type === 'income').length} income transactions
                    </p>
                </div>
                
                <div className="expense-card stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm opacity-90">Total Expenses</p>
                            <p className="text-2xl md:text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
                        </div>
                        <div className="text-2xl">
                            <i className="fas fa-arrow-down"></i>
                        </div>
                    </div>
                    <p className="text-sm opacity-90">
                        {transactions.filter(t => t.type === 'expense').length} expense transactions
                    </p>
                </div>
                
                <div className="budget-card stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm opacity-90">Monthly Budget</p>
                            <input
                                type="number"
                                value={monthlyBudget}
                                onChange={(e) => setMonthlyBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="bg-transparent border-0 text-2xl md:text-3xl font-bold p-0 w-32"
                                min="0"
                                step="100"
                            />
                        </div>
                        <div className="text-2xl">
                            <i className="fas fa-chart-pie"></i>
                        </div>
                    </div>
                    <p className="text-sm opacity-90">
                        Remaining: ${Math.max(0, monthlyBudget - totalExpenses).toFixed(2)}
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="chart-container">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        <i className="fas fa-chart-line mr-2 text-blue-600"></i>Income Trend
                    </h3>
                    <canvas ref={incomeChartRef}></canvas>
                </div>
                
                <div className="chart-container">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        <i className="fas fa-chart-bar mr-2 text-red-600"></i>Expense Trend
                    </h3>
                    <canvas ref={expenseChartRef}></canvas>
                </div>
                
                <div className="chart-container">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        <i className="fas fa-chart-pie mr-2 text-green-600"></i>Budget Usage
                    </h3>
                    <canvas ref={budgetChartRef}></canvas>
                </div>
                
                <div className="chart-container">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        <i className="fas fa-tags mr-2 text-purple-600"></i>Expense by Category
                    </h3>
                    <canvas ref={categoryChartRef}></canvas>
                </div>
            </div>
            
            <div className="transaction-form mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                    <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus'} mr-3`}></i>
                    {editingId ? 'Edit' : 'Add New'} Transaction
                </h3>
                
                <form onSubmit={handleAddTransaction}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">Title</label>
                            <input
                                type="text"
                                value={newTransaction.title}
                                onChange={(e) => setNewTransaction({...newTransaction, title: e.target.value})}
                                className="input-field"
                                placeholder="e.g., Salary, Groceries..."
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">Amount ($)</label>
                            <input
                                type="number"
                                value={newTransaction.amount}
                                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                                className="input-field"
                                placeholder="0.00"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">Type</label>
                            <select
                                value={newTransaction.type}
                                onChange={(e) => {
                                    const type = e.target.value;
                                    setNewTransaction({
                                        ...newTransaction,
                                        type,
                                        category: categories[type][0]
                                    });
                                }}
                                className="select-field"
                            >
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">Category</label>
                            <select
                                value={newTransaction.category}
                                onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                                className="select-field"
                            >
                                {categories[newTransaction.type].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 mb-2 font-medium">Date</label>
                            <input
                                type="date"
                                value={newTransaction.date}
                                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button type="submit" className="btn-primary flex-1">
                            <i className={`fas ${editingId ? 'fa-save' : 'fa-plus-circle'} mr-2`}></i>
                            {editingId ? 'Update Transaction' : 'Add Transaction'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setNewTransaction({
                                        title: '',
                                        amount: '',
                                        type: 'expense',
                                        category: 'Food',
                                        date: new Date().toISOString().split('T')[0]
                                    });
                                    setEditingId(null);
                                }}
                                className="btn-secondary"
                            >
                                <i className="fas fa-times mr-2"></i>Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        <i className="fas fa-list mr-3"></i>Transaction History
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex gap-2">
                            {['all', 'income', 'expense', ...categories.expense.slice(0, 3)].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {f === 'all' ? 'All' : f}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleExportData} className="btn-secondary text-sm" title="Export Data">
                                <i className="fas fa-download"></i>
                            </button>
                            <label className="btn-secondary text-sm cursor-pointer" title="Import Data">
                                <i className="fas fa-upload"></i>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportData}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>
                
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-receipt text-4xl mb-4"></i>
                        <p className="text-lg">No transactions found</p>
                        <p className="text-sm">Add your first transaction above</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {filteredTransactions.map(transaction => (
                            <div
                                key={transaction.id}
                                className={`transaction-item ${transaction.type} p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white shadow-sm hover:shadow-md`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`category-badge ${transaction.type}-badge`}>
                                                {transaction.category}
                                            </span>
                                            <span className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                ${transaction.amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-800">{transaction.title}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(transaction.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditTransaction(transaction)} className="edit-btn" title="Edit">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button onClick={() => handleDeleteTransaction(transaction.id)} className="delete-btn" title="Delete">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <footer className="mt-8 text-center text-gray-600 text-sm">
                <p>Personal Finance Tracker | Built with React.js, Chart.js, Tailwind CSS & Local Storage</p>
                <p className="mt-2">
                    Total Transactions: {transactions.length} | Data stored locally in browser
                </p>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FinanceTracker />);
