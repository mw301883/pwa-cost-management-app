import { useState } from 'react';

function TransactionsPage() {
    const [transactions, setTransactions] = useState([
        { id: 1, description: 'Zakupy spożywcze', amount: -120.50 },
        { id: 2, description: 'Wynagrodzenie', amount: 3000 },
        { id: 3, description: 'Abonament Spotify', amount: -19.99 },
    ]);

    return (
        <div className="container py-4">
            <h2>Transakcje</h2>
            <ul className="list-group">
                {transactions.map(tx => (
                    <li
                        key={tx.id}
                        className={`list-group-item d-flex justify-content-between ${tx.amount < 0 ? 'text-danger' : 'text-success'}`}
                    >
                        {tx.description}
                        <span>{tx.amount.toFixed(2)} zł</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TransactionsPage;
