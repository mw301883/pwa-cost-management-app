import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light py-3">
            <div className="container">
                <Link className="navbar-brand" to="/">BudżetApp</Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarContent"
                    aria-controls="navbarContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse justify-content-center" id="navbarContent">
                    <ul className="navbar-nav">
                        <li className="nav-item"><Link className="nav-link" to="/budget">Budżet</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/transactions">Transakcje</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/reports">Raporty</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/analysis">Analiza</Link></li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
