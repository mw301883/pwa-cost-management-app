import { useEffect, useState } from 'react';
import axios from 'axios';

function TransactionsPage({ isOnline }) {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [transactions, setTransactions] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [syncStatus, setSyncStatus] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, [selectedMonth]);

    useEffect(() => {
        if (isOnline) {
            syncOfflineTransactions();
        }
    }, [isOnline]);

    const fetchTransactions = async () => {
        if (isOnline) {
            try {
                const res = await axios.get(`/api/transactions/${selectedMonth}`);
                setTransactions(res.data);
                

                localStorage.setItem(`transactions-${selectedMonth}`, JSON.stringify(res.data));
            } catch (err) {
                console.warn("❌ Błąd pobierania transakcji z API:", err);
                // W przypadku błędu, próbujemy załadować dane z localStorage
                const localTransactions = JSON.parse(localStorage.getItem(`transactions-${selectedMonth}`)) || [];
                setTransactions(localTransactions);
            }
        } else {
            // Odczyt transakcji z localStorage w trybie offline
            const localTransactions = JSON.parse(localStorage.getItem(`transactions-${selectedMonth}`)) || [];
            setTransactions(localTransactions);
        }
    };

    // Synchronizacja transakcji lokalnych z serwerem
    const syncOfflineTransactions = async () => {
        // Sprawdź wszystkie miesiące w localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('transactions-pending-')) {
                try {
                    setSyncStatus("Synchronizacja transakcji offline...");
                    
                    const date = key.replace('transactions-pending-', '');
                    const pendingTransactions = JSON.parse(localStorage.getItem(key)) || [];
                    
                    if (pendingTransactions.length > 0) {
                        // Wyślij transakcje na serwer do synchronizacji
                        await axios.post('/api/transactions/sync', {
                            transactions: pendingTransactions
                        });
                        
                        // Po udanej synchronizacji, usuń listę oczekujących transakcji
                        localStorage.removeItem(key);
                        
                        // Odśwież dane jeśli synchronizowaliśmy obecny miesiąc
                        if (date === selectedMonth) {
                            fetchTransactions();
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
        }
    };

    const updateLocalBudget = (numericAmount) => {
        // Pobierz bieżący budżet z localStorage
        const budgetKey = `budget-${selectedMonth}`;
        const currentBudget = JSON.parse(localStorage.getItem(budgetKey)) || { income: 0, expenses: 0 };
        
        // Aktualizuj przychody lub wydatki w zależności od znaku kwoty
        if (numericAmount >= 0) {
            currentBudget.income += numericAmount;
        } else {
            currentBudget.expenses += Math.abs(numericAmount);
        }
        
        // Zapisz zaktualizowany budżet w localStorage
        localStorage.setItem(budgetKey, JSON.stringify(currentBudget));
        
        // Zapisz również transakcję w localStorage
        const newTransaction = {
            _id: `local_${Date.now()}`, // Tymczasowe ID dla lokalnego przechowywania
            date: selectedMonth,
            description,
            amount: numericAmount
        };
        
        // Dodaj do listy wyświetlanych transakcji
        const updatedTransactions = [...transactions, newTransaction];
        setTransactions(updatedTransactions);
        localStorage.setItem(`transactions-${selectedMonth}`, JSON.stringify(updatedTransactions));
        
        // Jeśli offline, dodaj do oczekujących na synchronizację
        if (!isOnline) {
            const pendingKey = `transactions-pending-${selectedMonth}`;
            const pendingTransactions = JSON.parse(localStorage.getItem(pendingKey)) || [];
            pendingTransactions.push(newTransaction);
            localStorage.setItem(pendingKey, JSON.stringify(pendingTransactions));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || description.trim() === '') return;

        // Zaktualizuj lokalny budżet niezależnie od stanu połączenia
        updateLocalBudget(numericAmount);

        if (isOnline) {
            try {
                await axios.post('/api/transactions', {
                    date: selectedMonth,
                    description,
                    amount: numericAmount,
                });
                
                // Odśwież transakcje z serwera
                fetchTransactions();
            } catch (err) {
                console.warn("❌ Błąd zapisywania transakcji na serwerze:", err);
                // Dodaj do oczekujących na synchronizację
                const pendingKey = `transactions-pending-${selectedMonth}`;
                const pendingTransactions = JSON.parse(localStorage.getItem(pendingKey)) || [];
                pendingTransactions.push({
                    date: selectedMonth,
                    description,
                    amount: numericAmount
                });
                localStorage.setItem(pendingKey, JSON.stringify(pendingTransactions));
            }
        }

        setDescription('');
        setAmount('');
    };

    return (
        <div className="container py-4">
            <h2>Transakcje</h2>

            {syncStatus && (
                <div className="alert alert-info mb-3">{syncStatus}</div>
            )}

            <div className="mb-3">
                <label>Miesiąc:</label>
                <input
                    type="month"
                    className="form-control"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                />
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
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Dodaj transakcję</button>
            </form>

            <ul className="list-group">
                {transactions.map(tx => (
                    <li
                        key={tx._id}
                        className={`list-group-item d-flex justify-content-between ${tx.amount < 0 ? 'text-danger' : 'text-success'}`}
                    >
                        {tx.description}
                        <span>{tx.amount.toFixed(2)} zł</span>
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