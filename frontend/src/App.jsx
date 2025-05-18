import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage.jsx';
import Navbar from "./components/Navbar.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import AnalysisPage from "./pages/AnalysisPage.jsx";

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<DashboardPage/>}/>
                <Route path="/budget" element={<BudgetPage/>}/>
                <Route path="/transactions" element={<TransactionsPage/>}/>
                <Route path="/reports" element={<ReportsPage/>}/>
                <Route path="/analysis" element={<AnalysisPage/>}/>
            </Routes>
        </Router>
    );
}

export default App;
