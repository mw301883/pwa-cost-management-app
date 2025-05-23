const notifyOnSavingsDeficit = (currentSavings, expectedSavings, month) => {
    if (Notification.permission === 'granted') {
        const title = 'Ostrzeżenie o oszczędnościach';
        const body = `Twoje aktualne oszczędności (${currentSavings.toFixed(2)} PLN) są niższe niż przewidywane (${expectedSavings.toFixed(2)} PLN) dla miesiąca ${month}.`;

        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.showNotification(title, {
                    body,
                    icon: '/icons/manifest-icon-192.maskable.png',
                    badge: '/icons/manifest-icon-192.maskable.png',
                });
            }
        });

        fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: new Date().toLocaleDateString('pl-PL'),
                timestamp: new Date().toISOString(),
                message: body,
            }),
        }).catch(err => {
            console.error('Błąd zapisu powiadomienia do bazy:', err);
        });
    }
};

export default notifyOnSavingsDeficit;
