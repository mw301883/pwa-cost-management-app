import {useState, useEffect} from 'react';

function ReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoverDeleteAll, setHoverDeleteAll] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const localKey = 'reports-cache';
    const pendingDeleteKey = 'reports-delete-pending';

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    useEffect(() => {
        const syncDeletedReports = async () => {
            if (!isOnline) return;

            const pendingDeletes = JSON.parse(localStorage.getItem(pendingDeleteKey)) || [];

            for (const id of pendingDeletes) {
                try {
                    await fetch(`/api/reports/${id}`, {method: 'DELETE'});
                } catch (err) {
                    console.warn(`❌ Nie udało się usunąć raportu offline (${id}):`, err);
                }
            }

            if (pendingDeletes.length > 0) {
                localStorage.removeItem(pendingDeleteKey);
                fetchReports();
            }
        };

        syncDeletedReports();
    }, [isOnline]);

    const fetchReports = () => {
        setLoading(true);
        setError(null);

        if (isOnline) {
            fetch('/api/reports')
                .then(res => {
                    if (!res.ok) throw new Error('Błąd sieci');
                    return res.json();
                })
                .then(data => {
                    setReports(data);
                    localStorage.setItem(localKey, JSON.stringify(data));
                    setLoading(false);
                })
                .catch(err => {
                    console.warn("❌ Błąd API, próba odczytu z cache:", err);
                    const cached = JSON.parse(localStorage.getItem(localKey)) || [];
                    setReports(cached);
                    setError(err.message);
                    setLoading(false);
                });
        } else {
            const cached = JSON.parse(localStorage.getItem(localKey)) || [];
            setReports(cached);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDelete = (id) => {
        if (isOnline) {
            fetch(`/api/reports/${id}`, {method: 'DELETE'})
                .then(res => {
                    if (!res.ok) throw new Error('Błąd podczas usuwania');
                    fetchReports();
                })
                .catch(err => {
                    alert(err.message);
                });
        } else {
            const updated = reports.filter(r => r._id !== id);
            setReports(updated);
            localStorage.setItem(localKey, JSON.stringify(updated));

            const pending = JSON.parse(localStorage.getItem(pendingDeleteKey)) || [];
            pending.push(id);
            localStorage.setItem(pendingDeleteKey, JSON.stringify(pending));
        }
    };

    const handleDeleteAll = () => {
        if (!window.confirm('Czy na pewno chcesz usunąć wszystkie raporty?')) return;

        if (isOnline) {
            fetch('/api/reports/all', {method: 'DELETE'})
                .then(res => {
                    if (!res.ok) throw new Error('Błąd podczas usuwania wszystkich raportów');
                    fetchReports();
                })
                .catch(err => {
                    alert(err.message);
                });
        } else {
            const allIds = reports.map(r => r._id);
            localStorage.setItem(pendingDeleteKey, JSON.stringify(allIds));
            setReports([]);
            localStorage.setItem(localKey, JSON.stringify([]));
        }
    };

    if (loading) return <p style={{textAlign: 'center'}}>Ładowanie danych...</p>;

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
            <header style={{maxWidth: '600px', textAlign: 'center'}}>
                <h1>Raporty</h1>
                <p>Przeglądaj listę raportów i zarządzaj nimi, usuwając niepotrzebne pozycje.</p>

                {!isOnline && (
                    <div className="alert alert-warning mt-3">
                        Pracujesz w trybie offline – zmiany zostaną zsynchronizowane po przywróceniu połączenia.
                    </div>
                )}

                {reports.length !== 0 ? (
                    <button
                        onClick={handleDeleteAll}
                        onMouseEnter={() => setHoverDeleteAll(true)}
                        onMouseLeave={() => setHoverDeleteAll(false)}
                        style={{
                            marginTop: '10px',
                            backgroundColor: hoverDeleteAll ? '#a93226' : '#c0392b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'background-color 0.3s ease',
                        }}
                    >
                        Usuń wszystkie
                    </button>
                ) : null}
            </header>

            {error && (
                <p style={{color: 'red', marginTop: '10px'}}>Błąd: {error}</p>
            )}

            {reports.length === 0 ? (
                <p style={{textAlign: 'center', marginTop: '50px'}}>Brak raportów do wyświetlenia.</p>
            ) : (
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
            )}
        </div>
    );
}

export default ReportsPage;
