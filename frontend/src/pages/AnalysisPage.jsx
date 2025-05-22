import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function AnalysisPage({ isOnline }) {
    const [months, setMonths] = useState([]);
    const [chartData, setChartData] = useState({});
    const [selectedYear, setSelectedYear] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [availableYears, setAvailableYears] = useState([]);
    const [filters, setFilters] = useState({
        plannedIncome: true,
        plannedExpenses: true,
        actualIncome: true,
        actualExpenses: true,
        plannedSavings: true,
        actualSavings: true,
    });

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

            const sorted = Array.from(found).sort();
            setMonths(sorted);
        };

        loadMonths();
    }, [isOnline]);

    useEffect(() => {
        if (months.length > 0) {
            const years = Array.from(new Set(months.map(m => m.split('-')[0]))).sort();
            setAvailableYears(years);
            const currentYear = new Date().getFullYear().toString();
            const latestYear = years.includes(currentYear) ? currentYear : years[years.length - 1];
            setSelectedYear(latestYear);
            generateChartDataByYear(months, years);
        }
    }, [months]);

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

    const calculateActualData = async (upToDate) => {
        let income = 0;
        let expenses = 0;

        for (const month of months) {
            if (month <= upToDate) {
                let transactions = JSON.parse(localStorage.getItem(`transactions-${month}`));
                if (!transactions && isOnline) {
                    try {
                        const res = await fetch(`/api/transactions/${month}`);
                        if (res.ok) {
                            transactions = await res.json();
                            localStorage.setItem(`transactions-${month}`, JSON.stringify(transactions));
                        } else {
                            transactions = [];
                        }
                    } catch (err) {
                        console.warn(`❌ Błąd pobierania transakcji z API (${month}):`, err);
                        transactions = [];
                    }
                }

                transactions = transactions || [];
                for (const t of transactions) {
                    if (t.amount >= 0) {
                        income += t.amount;
                    } else {
                        expenses += Math.abs(t.amount);
                    }
                }
            }
        }

        return {
            actualIncome: income,
            actualExpenses: expenses,
            actualSavings: income - expenses
        };
    };

    const generateChartDataByYear = async (months, years) => {
        setIsLoading(true);
        const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
        const groupedData = {};

        for (const year of years) {
            const filteredMonths = months.filter(m => m.startsWith(year));
            groupedData[year] = [];

            for (const month of filteredMonths) {
                const budget = JSON.parse(localStorage.getItem(`budget-${month}`)) || { income: 0, expenses: 0 };
                const [y, m] = month.split('-');

                const predicted = calculatePredictedBalance(month);
                const actual = await calculateActualData(month);

                groupedData[year].push({
                    name: `${monthNames[parseInt(m, 10) - 1]} ${y}`,
                    month,
                    plannedSavings: predicted,
                    actualSavings: actual.actualSavings,
                    plannedIncome: parseFloat(budget.income) || 0,
                    plannedExpenses: parseFloat(budget.expenses) || 0,
                    actualIncome: actual.actualIncome,
                    actualExpenses: actual.actualExpenses
                });
            }
        }

        setChartData(groupedData);
        setIsLoading(false);
    };

    const currentYearData = chartData[selectedYear] || [];

    const chartHeight = windowWidth >= 768 ? 500 : 300;
    const minChartWidth = currentYearData.length > 6 ? currentYearData.length * 60 : '100%';

    const toggleFilter = (key) => {
        setFilters((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <div className="container py-4">
            <h2>Analiza</h2>
            <p>Wykres oszczędności, przychodów i wydatków (planowane vs rzeczywiste).</p>

            {availableYears.length > 1 && (
                <div className="mb-3">
                    <label htmlFor="year-select" className="form-label">Wybierz rok:</label>
                    <select
                        id="year-select"
                        className="form-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Filtry linii */}
            <div className="mb-3">
                <strong>Filtry wykresu:</strong>
                <div className="form-check">
                    <input
                        type="checkbox"
                        id="filter-plannedIncome"
                        className="form-check-input"
                        checked={filters.plannedIncome}
                        onChange={() => toggleFilter('plannedIncome')}
                    />
                    <label className="form-check-label" htmlFor="filter-plannedIncome">Przychód planowany</label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        id="filter-plannedExpenses"
                        className="form-check-input"
                        checked={filters.plannedExpenses}
                        onChange={() => toggleFilter('plannedExpenses')}
                    />
                    <label className="form-check-label" htmlFor="filter-plannedExpenses">Wydatki planowane</label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        id="filter-actualIncome"
                        className="form-check-input"
                        checked={filters.actualIncome}
                        onChange={() => toggleFilter('actualIncome')}
                    />
                    <label className="form-check-label" htmlFor="filter-actualIncome">Przychód rzeczywisty</label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        id="filter-actualExpenses"
                        className="form-check-input"
                        checked={filters.actualExpenses}
                        onChange={() => toggleFilter('actualExpenses')}
                    />
                    <label className="form-check-label" htmlFor="filter-actualExpenses">Wydatki rzeczywiste</label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        id="filter-plannedSavings"
                        className="form-check-input"
                        checked={filters.plannedSavings}
                        onChange={() => toggleFilter('plannedSavings')}
                    />
                    <label className="form-check-label" htmlFor="filter-plannedSavings">Planowane oszczędności</label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        id="filter-actualSavings"
                        className="form-check-input"
                        checked={filters.actualSavings}
                        onChange={() => toggleFilter('actualSavings')}
                    />
                    <label className="form-check-label" htmlFor="filter-actualSavings">Rzeczywiste oszczędności</label>
                </div>
            </div>

            {!isLoading && currentYearData.length > 0 && (
                <>
                    <div
                        className="chart-wrapper mb-4"
                        style={{ width: '100%', minHeight: chartHeight, overflowX: 'auto' }}
                    >
                        <div style={{ minWidth: minChartWidth, height: chartHeight }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={currentYearData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`${value.toFixed(2)} zł`, undefined]} />
                                    <Legend />
                                    {filters.plannedIncome && (
                                        <Line
                                            type="monotone"
                                            dataKey="plannedIncome"
                                            stroke="#82ca9d"
                                            name="Przychód planowany"
                                        />
                                    )}
                                    {filters.plannedExpenses && (
                                        <Line
                                            type="monotone"
                                            dataKey="plannedExpenses"
                                            stroke="#ff7300"
                                            name="Wydatki planowane"
                                        />
                                    )}
                                    {filters.actualIncome && (
                                        <Line
                                            type="monotone"
                                            dataKey="actualIncome"
                                            stroke="#2e7d32"
                                            name="Przychód rzeczywisty"
                                        />
                                    )}
                                    {filters.actualExpenses && (
                                        <Line
                                            type="monotone"
                                            dataKey="actualExpenses"
                                            stroke="#c62828"
                                            name="Wydatki rzeczywiste"
                                        />
                                    )}
                                    {filters.plannedSavings && (
                                        <Line
                                            type="monotone"
                                            dataKey="plannedSavings"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            name="Planowane oszczędności"
                                        />
                                    )}
                                    {filters.actualSavings && (
                                        <Line
                                            type="monotone"
                                            dataKey="actualSavings"
                                            stroke="#ff0000"
                                            strokeWidth={2}
                                            name="Rzeczywiste oszczędności"
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                            <tr>
                                <th>Miesiąc</th>
                                <th>Przychód (plan)</th>
                                <th>Wydatki (plan)</th>
                                <th>Przychód (rzeczywisty)</th>
                                <th>Wydatki (rzeczywiste)</th>
                                <th>Oszczędności (plan)</th>
                                <th>Oszczędności (rzeczywiste)</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentYearData.map((item) => (
                                <tr key={item.month}>
                                    <td>{item.name}</td>
                                    <td>{item.plannedIncome.toFixed(2)} zł</td>
                                    <td>{item.plannedExpenses.toFixed(2)} zł</td>
                                    <td>{item.actualIncome.toFixed(2)} zł</td>
                                    <td>{item.actualExpenses.toFixed(2)} zł</td>
                                    <td className={item.plannedSavings >= 0 ? 'text-success' : 'text-danger'}>
                                        {item.plannedSavings.toFixed(2)} zł
                                    </td>
                                    <td className={item.actualSavings >= 0 ? 'text-success' : 'text-danger'}>
                                        {item.actualSavings.toFixed(2)} zł
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {!isLoading && currentYearData.length === 0 && (
                <div className="alert alert-warning mt-4">
                    <h5 className="mb-2">Brak danych budżetowych dla roku {selectedYear}</h5>
                    <p>Dodaj budżet miesięczny w zakładce "Budżet", aby móc generować wykresy.</p>
                </div>
            )}

            {isLoading && (
                <div className="d-flex justify-content-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Ładowanie...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalysisPage;
