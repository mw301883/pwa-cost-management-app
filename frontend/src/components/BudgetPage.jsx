import { useState, useEffect } from 'react';

function BudgetPage() {
    const [income, setIncome] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [balance, setBalance] = useState(0);

    
    useEffect(() => {
        const savedIncome = parseFloat(localStorage.getItem('income')) || 0;
        const savedExpenses = parseFloat(localStorage.getItem('expenses')) || 0;
        setIncome(savedIncome);
        setExpenses(savedExpenses);
        setBalance(savedIncome - savedExpenses);
    }, []);

    const handleSave = () => {
        localStorage.setItem('income', income);
        localStorage.setItem('expenses', expenses);
        setBalance(income - expenses);
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

            <button className="btn btn-primary" onClick={handleSave}>Zapisz</button>

            <hr />

            <h4>Aktualne saldo: {balance.toFixed(2)} zł</h4>
        </div>
    );
}

export default BudgetPage;
