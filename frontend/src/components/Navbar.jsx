import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light px-3">
            <Link className="navbar-brand" to="/">BudżetApp</Link>
            <div className="collapse navbar-collapse">
                <ul className="navbar-nav me-auto">
                    <li className="nav-item"><Link className="nav-link" to="/budget">Budżet</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/transactions">Transakcje</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/reports">Raporty</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/analysis">Analiza</Link></li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;