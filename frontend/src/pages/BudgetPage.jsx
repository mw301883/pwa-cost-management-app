import { useState, useEffect } from 'react';
import handleNumberKeyDown from "../helpers/numInputVerifier.js";
import notifyOnSavingsDeficit from "../helpers/notifyOnSavingsDeficit.js";

function BudgetPage({ isOnline }) {
    const [income, setIncome] = useState('');
    const [expenses, setExpenses] = useState('');
    const [predictedBalance, setPredictedBalance] = useState(0);
    const [actualBalance, setActualBalance] = useState(0);
    const [months, setMonths] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [date, setDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [transactionsForCurrentMonth,setTransactionsForCurrentMonth] = useState({});

    useEffect(() => {
        const initMonthsAndLoadData = async () => {
            const found = new Set();

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('budget-')) {
                    const dateKey = key.replace('budget-', '');
                    found.add(dateKey);
                }
            }

            if (found.size === 0 && isOnline) {
                try {
                    const res = await fetch('/api/budget');
                    if (res.ok) {
                        const apiBudgets = await res.json();
                        for (const entry of apiBudgets) {
                            localStorage.setItem(`budget-${entry.date}`, JSON.stringify(entry));
                            found.add(entry.date);
                        }
                    }
                } catch (err) {
                    console.warn("❌ Błąd pobierania danych z API:", err);
                }
            }

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            found.add(currentMonth);

            const sorted = Array.from(found).sort();
            setMonths(sorted);

            let selectedDate = date;
            if (!sorted.includes(date)) {
                selectedDate = currentMonth;
                setDate(currentMonth);
            }

            const fetchTransactionsForCurrentMonth = async () => {
                try {
                    if (isOnline) {
                        const res = await fetch(`/api/transactions/${selectedDate}`);
                        if (res.ok) {
                            const transactions = await res.json();
                            setTransactionsForCurrentMonth(transactions);
                        }
                    } else {
                        const transactions = JSON.parse(localStorage.getItem(`transactions-${selectedDate}`)) || [];
                        setTransactionsForCurrentMonth(transactions);
                    }
                } catch (e) {
                    console.error(`Błąd pobierania transakcji dla ${selectedDate}:`, e);
                }
            }

            const loadFromLocalStorage = () => {
                const saved = JSON.parse(localStorage.getItem(`budget-${selectedDate}`)) || { income: 0, expenses: 0 };
                setIncome(String(saved.income));
                setExpenses(String(saved.expenses));
                setPredictedBalance(calculatePredictedBalance(selectedDate));
            };

            const syncAllBudgetsWithAPI = async () => {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('budget-')) {
                        const date = key.replace('budget-', '');
                        const localData = JSON.parse(localStorage.getItem(key));

                        try {
                            const res = await fetch(`/api/budget/${date}`);
                            if (!res.ok) throw new Error();

                            const serverData = await res.json();
                            const isDifferent = (
                                serverData.income !== localData.income ||
                                serverData.expenses !== localData.expenses
                            );

                            if (isDifferent) {
                                await updateServerBudget(date, localData);
                            }
                        } catch {
                            await updateServerBudget(date, localData);
                        }
                    }
                }
            };

            await fetchTransactionsForCurrentMonth();

            if (isOnline) {
                await syncAllBudgetsWithAPI();

                try {
                    const res = await fetch(`/api/budget/${selectedDate}`);
                    if (!res.ok) throw new Error("Brak danych na serwerze");

                    const data = await res.json();

                    setIncome(String(data.income));
                    setExpenses(String(data.expenses));
                    setPredictedBalance(calculatePredictedBalance(selectedDate));

                    localStorage.setItem(`budget-${selectedDate}`, JSON.stringify(data));
                } catch {
                    loadFromLocalStorage();
                }
            } else {
                loadFromLocalStorage();
            }
            setIsInitialized(true);
        };

        initMonthsAndLoadData();
    }, [isOnline, date]);

    useEffect(() => {
        if (!isInitialized) return;

        const newPredicted = calculatePredictedBalance(date);
        const newActual = calculateActualBalance(date);

        setPredictedBalance(newPredicted);
        setActualBalance(newActual);

        if (newActual < newPredicted && isOnline) {
            notifyOnSavingsDeficit(newActual, newPredicted, date);
        }
    }, [isInitialized, date, transactionsForCurrentMonth]);


    const calculatePredictedBalance = (upToDate) => {
        let totalIncome = 0;
        let totalExpenses = 0;

        months.forEach((month) => {
            if (month <= upToDate) {
                const budget = JSON.parse(localStorage.getItem(`budget-${month}`));
                if (budget) {
                    totalIncome += parseFloat(budget.income) || 0;
                    totalExpenses += parseFloat(budget.expenses) || 0;
                }
            }
        });

        return totalIncome - totalExpenses;
    };

    const calculateActualBalance = (upToDate) => {
        let total = 0;

        months.forEach((month) => {
            if (month < upToDate) {
                const transactions = JSON.parse(localStorage.getItem(`transactions-${month}`)) || [];
                for (const t of transactions) {
                    total += t.amount;
                }
            }
        });

        if (upToDate && Array.isArray(transactionsForCurrentMonth)) {
            for (const t of transactionsForCurrentMonth) {
                total += t.amount;
            }
        }

        return total;
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

    const handleSave = () => {
        const newIncome = parseFloat(income) || 0;
        const newExpenses = parseFloat(expenses) || 0;
        const data = { income: newIncome, expenses: newExpenses };
        localStorage.setItem(`budget-${date}`, JSON.stringify(data));
        if (!months.includes(date)) {
            setMonths(prev => Array.from(new Set([...prev, date])).sort());
        }
        setPredictedBalance(calculatePredictedBalance(date));
        setActualBalance(calculateActualBalance(date));
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
                setPredictedBalance(calculatePredictedBalance(newMonth));
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
                setPredictedBalance(calculatePredictedBalance(newMonth));
            }
        } else {
            setDate(value);
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
                <label className="form-label">Przewidywane przychody (zł)</label>
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
                <label className="form-label">Przewidywane wydatki (zł)</label>
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

            <h4>Przewidywane oszczędności z bieżącego miesiąca: {predictedBalance.toFixed(2)} zł</h4>

            <hr />

            <h4>Obliczone oszczędności z bieżącego miesiąca: {actualBalance.toFixed(2)} zł</h4>

            {Array.isArray(transactionsForCurrentMonth) && transactionsForCurrentMonth.length > 0 ? (
                <div className="mt-4">
                    <h5>Transakcje</h5>
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>Data</th>
                            <th>Opis</th>
                            <th>Kwota</th>
                            <th>Typ</th>
                        </tr>
                        </thead>
                        <tbody>
                        {transactionsForCurrentMonth.map((t, idx) => (
                            <tr key={idx}>
                                <td>{t.date}</td>
                                <td>{t.description}</td>
                                <td>{t.amount.toFixed(2)} zł</td>
                                <td>{t.amount >= 0 ? 'Przychód' : 'Wydatek'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted mt-3">Brak transakcji dla wybranego miesiąca.</p>
            )}
        </div>
    );
}

export default BudgetPage;
