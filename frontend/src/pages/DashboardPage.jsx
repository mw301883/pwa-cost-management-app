import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');

        if (!token || !storedUserId) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUserId);
            setUser(parsedUser);
        } catch (err) {
            console.error('Błąd parsowania danych użytkownika:', err);
            localStorage.removeItem('userId');
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Dashboard</h2>
                <button className="btn btn-outline-danger" onClick={handleLogout}>Wyloguj się</button>
            </div>
            {user ? (
                <div className="card p-4 shadow">
                    <h4>Witaj, {user.name || 'użytkowniku'}!</h4>
                    <p>To jest Twoje centrum zarządzania kosztami. Wkrótce pojawią się tutaj dane finansowe.</p>
                </div>
            ) : (
                <p>Ładowanie...</p>
            )}
        </div>
    );
}

export default DashboardPage;
