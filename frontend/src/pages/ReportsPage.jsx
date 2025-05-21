import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ReportsPage({ isOnline }) {
    const [months, setMonths] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showChart, setShowChart] = useState(false);

    useEffect(() => {
        const loadMonths = async () => {
            setIsLoading(true);
            const found = new Set();

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('budget-')) {
                    const dateKey = key.replace('budget-', '');
                    found.add(dateKey);
                }
            }


            if (isOnline && found.size === 0) {
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

            // Posortuj miesiące chronologicznie
            const sorted = Array.from(found).sort();
            setMonths(sorted);
            setIsLoading(false);
        };

        loadMonths();
    }, [isOnline]);

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

    const generateChartData = () => {
        setIsLoading(true);

        const data = months.map(month => {
            const budget = JSON.parse(localStorage.getItem(`budget-${month}`)) || { income: 0, expenses: 0 };


            const [year, monthNum] = month.split('-');
            const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
            const displayName = `${monthNames[parseInt(monthNum) - 1]} ${year}`;

            return {
                name: displayName,
                month: month,
                oszczednosci: calculatePredictedBalance(month),
                przychod: parseFloat(budget.income) || 0,
                wydatki: parseFloat(budget.expenses) || 0
            };
        });

        setChartData(data);
        setShowChart(true);
        setIsLoading(false);
    };

    return (
        <div className="container py-4">
            <h2>Raporty</h2>
            <p>Generuj wykres oszczednosci na przestrzeni miesięcy.</p>

            <div className="d-grid gap-2 col-6 mx-auto mb-4">
                <button
                    className="btn btn-primary"
                    onClick={generateChartData}
                    disabled={isLoading || months.length === 0}
                >
                    {isLoading ? (
                        <span>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Ładowanie...
                        </span>
                    ) : 'Generuj wykres oszczednosci'}
                </button>
            </div>

            {showChart && chartData.length > 0 && (
                <>
                    <h4 className="mb-3">Wykres oszczednosci</h4>
                    <div className="chart-container mb-4" style={{ width: '100%', height: '400px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value.toFixed(2)} zł`, undefined]} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="oszczednosci"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                    strokeWidth={2}
                                />
                                <Line type="monotone" dataKey="przychod" stroke="#82ca9d" />
                                <Line type="monotone" dataKey="wydatki" stroke="#ff7300" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                            <tr>
                                <th>Miesiąc</th>
                                <th>przychod</th>
                                <th>Wydatki</th>
                                <th>oszczednosci</th>
                            </tr>
                            </thead>
                            <tbody>
                            {chartData.map((item) => (
                                <tr key={item.month}>
                                    <td>{item.name}</td>
                                    <td>{item.przychod.toFixed(2)} zł</td>
                                    <td>{item.wydatki.toFixed(2)} zł</td>
                                    <td className={item.oszczednosci >= 0 ? 'text-success' : 'text-danger'}>
                                        {item.oszczednosci.toFixed(2)} zł
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {!showChart && months.length > 0 && (
                <div className="card p-3 mt-4">
                    <h5 className="mb-2">Kliknij przycisk wyżej, aby wygenerować wykres oszczednosci.</h5>
                </div>
            )}

            {months.length === 0 && (
                <div className="alert alert-warning mt-4">
                    <h5 className="mb-2">Brak danych budżetowych</h5>
                    <p>Dodaj budżet miesięczny w zakładce "Budżet", aby móc generować wykresy.</p>
                </div>
            )}
        </div>
    );
}

export default ReportsPage;