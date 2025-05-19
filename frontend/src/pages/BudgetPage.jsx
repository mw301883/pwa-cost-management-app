import { useState, useEffect } from 'react';

function BudgetPage() {
    const [income, setIncome] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [balance, setBalance] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});


    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    useEffect(() => {
        if (isOnline) {
            fetch(`/api/budget/${month}`)
                .then(res => res.json())
                .then(data => {
                    setIncome(data.income);
                    setExpenses(data.expenses);
                    setBalance(data.income - data.expenses);

                    localStorage.setItem(`budget-${month}`, JSON.stringify(data));

                })
                .catch(() => {
                    loadFromLocalStorage();
                });
        } else {
            loadFromLocalStorage();
        }
    }, [isOnline, month]);

    const loadFromLocalStorage = () => {
        const saved = JSON.parse(localStorage.getItem(`budget-${month}`)) || { income: 0, expenses: 0 };
        setIncome(saved.income);
        setExpenses(saved.expenses);
        setBalance(saved.income - saved.expenses);
    };

    const handleSave = () => {
        const newIncome = parseFloat(income) || 0;
        const newExpenses = parseFloat(expenses) || 0;
        const newBalance = newIncome - newExpenses;

        setBalance(newBalance);
        const data = { income: newIncome, expenses: newExpenses };
        localStorage.setItem(`budget-${month}`, JSON.stringify(data));

        if (isOnline) {
            fetch(`/api/budget/${month}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ income: newIncome, expenses: newExpenses }),
            }).catch(() => {
                console.warn("Nie udało się zapisać na serwerze – dane zapisane lokalnie");
            });
        }
    };

    return (
        <div className="container py-4">
            <h2>Budżet miesięczny</h2>

            <div className="mb-3">
                <label className="form-label">Przychody (zł)</label>
                <input
                    type="number"
                    className="form-control"
                    value={income}
                    onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Wydatki (zł)</label>
                <input
                    type="number"
                    className="form-control"
                    value={expenses}
                    onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Miesiąc</label>
                <input
                    type="month"
                    className="form-control"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                />
            </div>
            <button className="btn btn-primary" onClick={handleSave}>
                Zapisz
            </button>

            <hr />

            <h4>Aktualne saldo: {balance.toFixed(2)} zł</h4>
            <p>Status: <strong>{isOnline ? 'Online' : 'Offline (tryb lokalny)'}</strong></p>
        </div>
    );
}

export default BudgetPage;
