import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ReportsPage() {
    return (
        <div className="container py-4">
            <h2>Analiza</h2>
            <p>Analiza trendów wydatków i przychodów — w przyszłości wykresy i statystyki.</p>

            <div className="alert alert-info mt-3">
                Wersja demo: Brak danych do analizy. Dodaj transakcje, aby rozpocząć.
            </div>
        </div>
    );
}
export default ReportsPage;