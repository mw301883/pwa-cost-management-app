import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';

function DashboardPage() {
    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
               <Navbar />           
            </div>
                <div className="card p-4 shadow">
                    <p>To jest Twoje centrum zarządzania kosztami. Wkrótce pojawią się tutaj dane finansowe.</p>
                </div>
        </div>
    );
}

export default DashboardPage;
