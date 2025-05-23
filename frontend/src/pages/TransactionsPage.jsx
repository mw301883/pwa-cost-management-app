import {useEffect, useState} from 'react';
import axios from 'axios';
import handleNumberKeyDown from "../helpers/numInputVerifier.js";

function TransactionsPage({isOnline}) {
    const [months, setMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [transactions, setTransactions] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [syncStatus, setSyncStatus] = useState(null);

    useEffect(() => {
        const initMonthsAndSync = async () => {
            const found = new Set();

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('budget-')) {
                    const dateKey = key.replace('budget-', '');
                    found.add(dateKey);
                }
            }

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            found.add(currentMonth);

            const sorted = Array.from(found).sort();
            setMonths(sorted);

            if (!sorted.includes(selectedMonth)) {
                setSelectedMonth(currentMonth);
            }

            if (isOnline) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('transactions-pending-')) {
                        try {
                            setSyncStatus("Synchronizacja transakcji offline...");
                            const date = key.replace('transactions-pending-', '');
                            const pendingTransactions = JSON.parse(localStorage.getItem(key)) || [];

                            if (pendingTransactions.length > 0) {
                                await axios.post('/api/transactions/sync', {
                                    transactions: pendingTransactions
                                });
                                localStorage.removeItem(key);
                                if (date === selectedMonth) {
                                    await fetchTransactions(selectedMonth);
                                }
                            }

                            setSyncStatus("Synchronizacja zakończona");
                            setTimeout(() => setSyncStatus(null), 2000);
                        } catch (err) {
                            console.error("❌ Błąd synchronizacji transakcji:", err);
                            setSyncStatus("Błąd synchronizacji");
                            setTimeout(() => setSyncStatus(null), 2000);
                        }
                    }

                    if (key && key.startsWith('transactions-delete-pending-')) {
                        const idsToDelete = JSON.parse(localStorage.getItem(key)) || [];
                        for (const id of idsToDelete) {
                            try {
                                await axios.delete(`/api/transactions/${id}`);
                            } catch (err) {
                                console.warn(`❌ Nie udało się usunąć transakcji offline (${id}):`, err);
                            }
                        }
                        localStorage.removeItem(key);
                    }
                }
            }

            if (selectedMonth) {
                await fetchTransactions(selectedMonth);
            }
        };

        initMonthsAndSync();
    }, [isOnline, selectedMonth]);

    const fetchTransactions = async () => {
        if (isOnline) {
            try {
                const res = await axios.get(`/api/transactions/${selectedMonth}`);
                setTransactions(res.data);
                localStorage.setItem(`transactions-${selectedMonth}`, JSON.stringify(res.data));
            } catch (err) {
                console.warn("❌ Błąd pobierania transakcji z API:", err);
                const localTransactions = JSON.parse(localStorage.getItem(`transactions-${selectedMonth}`)) || [];
                setTransactions(localTransactions);
            }
        } else {
            const localTransactions = JSON.parse(localStorage.getItem(`transactions-${selectedMonth}`)) || [];
            setTransactions(localTransactions);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || description.trim() === '') return;

        if (isOnline) {
            try {
                await axios.post('/api/transactions', {
                    date: selectedMonth,
                    description,
                    amount: numericAmount,
                });
                fetchTransactions();
            } catch (err) {
                console.warn("❌ Błąd zapisywania transakcji na serwerze:", err);
                const pendingKey = `transactions-pending-${selectedMonth}`;
                const pendingTransactions = JSON.parse(localStorage.getItem(pendingKey)) || [];
                pendingTransactions.push({date: selectedMonth, description, amount: numericAmount});
                localStorage.setItem(pendingKey, JSON.stringify(pendingTransactions));
            }
        }

        setDescription('');
        setAmount('');
    };

    const handleDelete = async (transactionId) => {
        if (!window.confirm("Czy na pewno chcesz usunąć tę transakcję?")) return;

        if (isOnline) {
            try {
                await axios.delete(`/api/transactions/${transactionId}`);
                fetchTransactions();
            } catch (err) {
                console.warn("❌ Błąd usuwania transakcji z API:", err);
                alert("Błąd usuwania transakcji.");
            }
            const updated = transactions.filter(t => t._id !== transactionId);
            setTransactions(updated);
            localStorage.setItem(`transactions-${selectedMonth}`, JSON.stringify(updated));

            const pendingDeletesKey = `transactions-delete-pending-${selectedMonth}`;
            const pendingDeletes = JSON.parse(localStorage.getItem(pendingDeletesKey)) || [];
            pendingDeletes.push(transactionId);
            localStorage.setItem(pendingDeletesKey, JSON.stringify(pendingDeletes));
        }
    };

    return (
        <div className="container py-4">
            <h2>Transakcje</h2>

            {syncStatus && (
                <div className="alert alert-info mb-3">{syncStatus}</div>
            )}

            <div className="mb-3">
                <label className="form-label">Miesiąc</label>
                <select className="form-select" value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}>
                    {months.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>
            </div>

            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Opis"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Kwota (np. -100 lub 200)"
                    value={amount}
                    onKeyDown={handleNumberKeyDown}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Dodaj transakcję</button>
            </form>

            <ul className="list-group">
                {transactions.map(tx => (
                    <li
                        key={tx._id}
                        className={`list-group-item d-flex justify-content-between align-items-center ${tx.amount < 0 ? 'text-danger' : 'text-success'}`}
                    >
                        <span>
                            <strong>{tx.description}</strong><br/>
                            <small>{tx.amount.toFixed(2)} zł</small>
                        </span>
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(tx._id)}
                            title="Usuń transakcję"
                        >
                            🗑️
                        </button>
                    </li>
                ))}
            </ul>

            {(!isOnline && transactions.length > 0) && (
                <div className="alert alert-warning mt-3">
                    <small>Transakcje zostaną zsynchronizowane z serwerem po przywróceniu połączenia.</small>
                </div>
            )}
        </div>
    );
}

export default TransactionsPage;
