import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage.jsx';
import Navbar from "./components/Navbar.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import AnalysisPage from "./pages/AnalysisPage.jsx";
import Footer from "./components/Footer.jsx";
import {useState, useEffect} from "react";

function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Powiadomienia włączone");
                } else {
                    console.log("Powiadomienia odrzucone");
                }
            });
        }
    }, []);

    return (
        <div className="d-flex flex-column min-vh-100">
            <Router>
                <Navbar />
                <div className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<DashboardPage isOnline={isOnline}/>}/>
                        <Route path="/budget" element={<BudgetPage isOnline={isOnline}/>}/>
                        <Route path="/transactions" element={<TransactionsPage isOnline={isOnline}/>}/>
                        <Route path="/reports" element={<ReportsPage isOnline={isOnline}/>}/>
                        <Route path="/analysis" element={<AnalysisPage isOnline={isOnline}/>}/>
                    </Routes>
                </div>
                <Footer isOnline={isOnline}/>
            </Router>
        </div>
    );
}

export default App;
