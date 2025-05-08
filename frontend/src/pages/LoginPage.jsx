import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/api/users/login', { email, password });
            const { token, userId } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', JSON.stringify(userId));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Wystąpił błąd');
        }
    };

    return (
        <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
            <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="mb-4 text-center">Logowanie</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Hasło</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Zaloguj się</button>
                </form>
                <p className="mt-3 text-center">
                    Nie masz konta? <Link to="/register">Zarejestruj się</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
