import { useState, useEffect } from 'react';

function ReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReports = () => {
        setLoading(true);
        setError(null);
        fetch('/api/reports')
            .then(res => {
                if (!res.ok) throw new Error('Błąd sieci');
                return res.json();
            })
            .then(data => {
                setReports(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDelete = (id) => {
        fetch(`/api/reports/${id}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error('Błąd podczas usuwania');
                fetchReports();
            })
            .catch(err => {
                alert(err.message);
            });
    };

    if (loading) return <p style={{ textAlign: 'center' }}>Ładowanie danych...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red' }}>Błąd: {error}</p>;
    if (reports.length === 0) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Brak raportów do wyświetlenia.</p>;

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                gap: '30px',
                backgroundColor: '#f5f5f5',
            }}
        >
            <header style={{ maxWidth: '600px', textAlign: 'center' }}>
                <h1>Raporty</h1>
                <p>Przeglądaj listę raportów i zarządzaj nimi, usuwając niepotrzebne pozycje.</p>
            </header>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    maxWidth: '800px',
                    width: '100%',
                }}
            >
                {reports.map(report => (
                    <div
                        key={report._id}
                        style={{
                            border: '1px solid #ccc',
                            padding: '12px',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '400px',
                            boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
                            position: 'relative',
                            backgroundColor: 'white',
                        }}
                    >
                        <p><strong>Data:</strong> {report.date}</p>
                        <p><strong>Data utworzenia:</strong> {new Date(report.timestamp).toLocaleString()}</p>
                        <p><strong>Wiadomość:</strong> {report.message}</p>
                        <button
                            onClick={() => handleDelete(report._id)}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                            }}
                        >
                            Usuń
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ReportsPage;
