function Footer({ isOnline }) {
    return (
        <footer className="bg-light text-center py-3 mt-auto border-top">
            <div className="container">
                <p className="mb-1">© 2025 BudżetApp — Autorzy: Michał Wieczorek, Olaf Wnęczak</p>
                <p className="mb-0">
                    Status połączenia:{" "}
                    <strong className={isOnline ? "text-success" : "text-danger"}>
                        {isOnline ? "Online" : "Offline"}
                    </strong>
                </p>
            </div>
        </footer>
    );
}

export default Footer;