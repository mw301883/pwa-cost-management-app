function ReportsPage() {
    return (
        <div className="container py-4">
            <h2>Raporty</h2>
            <p>Tu będą generowane raporty miesięczne i roczne na podstawie transakcji.</p>

            <div className="card p-3 mt-4">
                <h5 className="mb-2">Przykładowy raport:</h5>
                <ul>
                    <li>Przychody: 3000 zł</li>
                    <li>Wydatki: 1200 zł</li>
                    <li>Oszczędności: 1800 zł</li>
                </ul>
            </div>
        </div>
    );
}

export default ReportsPage;
