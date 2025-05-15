import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './components/BudgetPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/budget" element={<BudgetPage />} />
            </Routes>
        </Router>
    );
}

export default App;
