import { useState, useEffect } from 'react';

function BudgetPage({ isOnline }) {
    const [income, setIncome] = useState('');
    const [expenses, setExpenses] = useState('');
    const [balance, setBalance] = useState(0);
    const [months, setMonths] = useState([]);

    const [date, setDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        const initMonths = () => {
            const found = new Set();
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('budget-')) {
                    const date = key.replace('budget-', '');
                    found.add(date);
                }
            }
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            found.add(currentMonth);
            const sorted = Array.from(found).sort();
            setMonths(sorted);
            if (!sorted.includes(date)) {
                setDate(currentMonth);
            }
        };
        initMonths();
    }, []);


    useEffect(() => {
        const loadData = async () => {
            if (isOnline) {
                await syncAllBudgetsWithAPI();

                try {
                    const res = await fetch(`/api/budget/${date}`);
                    if (!res.ok) throw new Error("Brak danych na serwerze");
                    const data = await res.json();

                    setIncome(String(data.income));
                    setExpenses(String(data.expenses));
                    setBalance(calculateCumulativeBalance(date));

                    localStorage.setItem(`budget-${date}`, JSON.stringify(data));
                } catch {
                    loadFromLocalStorage();
                }
            } else {
                loadFromLocalStorage();
            }
        };

        loadData();
    }, [isOnline, date]);

    const calculateCumulativeBalance = (upToDate) => {
        let totalIncome = 0;
        let totalExpenses = 0;

        months.forEach((month) => {
            if (month <= upToDate) {
                const item = JSON.parse(localStorage.getItem(`budget-${month}`));
                if (item) {
                    totalIncome += parseFloat(item.income) || 0;
                    totalExpenses += parseFloat(item.expenses) || 0;
                }
            }
        });

        return totalIncome - totalExpenses;
    };


    const syncAllBudgetsWithAPI = async () => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('budget-')) {
                const date = key.replace('budget-', '');
                const localData = JSON.parse(localStorage.getItem(key));

                try {
                    const res = await fetch(`/api/budget/${date}`);
                    if (!res.ok) throw new Error("Brak danych na serwerze");

                    const serverData = await res.json();

                    const isDifferent = (
                        serverData.income !== localData.income ||
                        serverData.expenses !== localData.expenses
                    );

                    if (isDifferent) {
                        await updateServerBudget(date, localData);
                    }
                } catch (err) {
                    await updateServerBudget(date, localData);
                }
            }
        }
    };

    const updateServerBudget = async (date, localData) => {
        try {
            await fetch(`/api/budget`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, ...localData }),
            });
            console.log(`✅ Zaktualizowano dane z lokalnego bufora do API dla: ${date}`);
        } catch (error) {
            console.warn(`❌ Błąd zapisu danych lokalnych na serwerze (${date}):`, error);
        }
    };

    const loadFromLocalStorage = () => {
        const saved = JSON.parse(localStorage.getItem(`budget-${date}`)) || { income: 0, expenses: 0 };
        setIncome(String(saved.income));
        setExpenses(String(saved.expenses));
        setBalance(calculateCumulativeBalance(date));
    };

    const handleSave = () => {
        const newIncome = parseFloat(income) || 0;
        const newExpenses = parseFloat(expenses) || 0;
        const newBalance = newIncome - newExpenses;

        setBalance(balance + newBalance);
        const data = { income: newIncome, expenses: newExpenses };
        localStorage.setItem(`budget-${date}`, JSON.stringify(data));

        if (isOnline) {
            fetch(`/api/budget`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date, income: newIncome, expenses: newExpenses }),
            }).catch(() => {
                console.warn("Nie udało się zapisać danych na serwerze – dane zapisane lokalnie.");
            });
        }
    };

    const handleMonthChange = (e) => {
        const value = e.target.value;
        if (value === '__add_new__') {
            const lastMonth = months[months.length - 1];
            const [yearStr, monthStr] = lastMonth.split("-");
            let year = parseInt(yearStr);
            let month = parseInt(monthStr);

            month++;
            if (month > 12) {
                month = 1;
                year++;
            }

            const newMonth = `${year}-${String(month).padStart(2, '0')}`;
            if (!months.includes(newMonth)) {
                const updated = [...months, newMonth];
                setMonths(updated);
                setDate(newMonth);

                const defaultData = { income: 0, expenses: 0 };
                localStorage.setItem(`budget-${newMonth}`, JSON.stringify(defaultData));

                if (isOnline) {
                    updateServerBudget(newMonth, defaultData);
                }

                setIncome('0');
                setExpenses('0');
                setBalance(calculateCumulativeBalance(newMonth));
            }
        } else if (value === '__add_prev__') {
            const firstMonth = months[0];
            const [yearStr, monthStr] = firstMonth.split("-");
            let year = parseInt(yearStr);
            let month = parseInt(monthStr);

            month--;
            if (month < 1) {
                month = 12;
                year--;
            }

            const newMonth = `${year}-${String(month).padStart(2, '0')}`;
            if (!months.includes(newMonth)) {
                const updated = [newMonth, ...months];
                setMonths(updated);
                setDate(newMonth);

                const defaultData = { income: 0, expenses: 0 };
                localStorage.setItem(`budget-${newMonth}`, JSON.stringify(defaultData));

                if (isOnline) {
                    updateServerBudget(newMonth, defaultData);
                }

                setIncome('0');
                setExpenses('0');
                setBalance(calculateCumulativeBalance(newMonth));
            }
        } else {
            setDate(value);
        }
    };

    const handleNumberKeyDown = (e) => {
        const allowedKeys = [
            'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End',
            '.',
        ];

        const isNumber = e.key >= '0' && e.key <= '9';
        const isAllowed = allowedKeys.includes(e.key);

        if (!isNumber && !isAllowed) {
            e.preventDefault();
        }
    };


    return (
        <div className="container py-4">
            <h2>Budżet miesięczny</h2>

            <div className="mb-3">
                <label className="form-label">Miesiąc</label>
                <select className="form-select" value={date} onChange={handleMonthChange}>
                    <option value="__add_prev__">➕ Dodaj poprzedni miesiąc</option>
                    {months.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                    <option value="__add_new__">➕ Dodaj nowy miesiąc</option>
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label">Przychody (zł)</label>
                <input
                    type="number"
                    className="form-control"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    inputMode="decimal"
                    onKeyDown={handleNumberKeyDown}
                    placeholder="np. 3500.00"
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Wydatki (zł)</label>
                <input
                    type="number"
                    className="form-control"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    inputMode="decimal"
                    onKeyDown={handleNumberKeyDown}
                    placeholder="np. 2200.50"
                />
            </div>

            <button className="btn btn-primary" onClick={handleSave}>
                Zapisz
            </button>

            <hr />

            <h4>Aktualne saldo: {balance.toFixed(2)} zł</h4>
        </div>
    );
}

export default BudgetPage;
