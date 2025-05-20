const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const transactions = await Transaction.find({ date });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { date, description, amount } = req.body;
        const transaction = new Transaction({ date, description, amount });
        await transaction.save();

        // Znajdujemy lub tworzymy budżet dla danego miesiąca
        let budget = await Budget.findOne({ date });
        if (!budget) {
            budget = new Budget({ date, income: 0, expenses: 0 });
        }

        // Aktualizujemy przychody lub wydatki w zależności od znaku kwoty
        if (amount >= 0) {
            budget.income += amount;
        } else {
            budget.expenses += Math.abs(amount);
        }
        
        await budget.save();

        res.json({ 
            message: 'Dodano transakcję', 
            transaction, 
            budget 
        });
    } catch (err) {
        console.error('Błąd zapisu transakcji:', err);
        res.status(500).json({ error: 'Błąd zapisu transakcji' });
    }
});

// Dodatkowy endpoint do synchronizacji wielu transakcji z trybu offline
router.post('/sync', async (req, res) => {
    try {
        const { transactions } = req.body;
        const results = [];
        
        for (const tx of transactions) {
            const { date, description, amount } = tx;
            
            // Sprawdź czy transakcja już istnieje (unikaj duplikatów)
            const existingTx = await Transaction.findOne({
                date,
                description,
                amount: amount
            });
            
            if (!existingTx) {
                const transaction = new Transaction({ date, description, amount });
                await transaction.save();
                
                // Aktualizuj budżet
                let budget = await Budget.findOne({ date });
                if (!budget) {
                    budget = new Budget({ date, income: 0, expenses: 0 });
                }
                
                if (amount >= 0) {
                    budget.income += amount;
                } else {
                    budget.expenses += Math.abs(amount);
                }
                
                await budget.save();
                
                results.push({ success: true, transaction });
            } else {
                results.push({ success: false, message: 'Transakcja już istnieje' });
            }
        }
        
        res.json({ message: 'Synchronizacja zakończona', results });
    } catch (err) {
        console.error('Błąd synchronizacji transakcji:', err);
        res.status(500).json({ error: 'Błąd synchronizacji transakcji' });
    }
});

module.exports = router;