import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Hasła nie pasują do siebie");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/users/register', {email, password});
            setSuccessMessage(response.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Wystąpił błąd');
        }
    };

    return (
        <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
            <div className="card shadow p-4" style={{width: '100%', maxWidth: '400px'}}>
                <h2 className="mb-4 text-center">Rejestracja</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" value={email}
                               onChange={(e) => setEmail(e.target.value)} required/>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Hasło</label>
                        <input type="password" className="form-control" value={password}
                               onChange={(e) => setPassword(e.target.value)} required/>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Potwierdź hasło</label>
                        <input type="password" className="form-control" value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)} required/>
                    </div>
                    <button type="submit" className="btn btn-success w-100">Zarejestruj się</button>
                </form>
                <p className="mt-3 text-center">
                    Masz już konto? <Link to="/login">Zaloguj się</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
