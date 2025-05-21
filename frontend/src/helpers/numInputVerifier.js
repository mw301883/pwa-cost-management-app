const handleNumberKeyDown = (e) => {
    const allowedKeys = [
        'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End',
        '.', '-',
    ];

    const isNumber = e.key >= '0' && e.key <= '9';
    const isAllowed = allowedKeys.includes(e.key);

    if (!isNumber && !isAllowed) {
        e.preventDefault();
    }
};

export default handleNumberKeyDown;