const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

router.get('/:date', async (req, res) => {
    try {
        const {date} = req.params;
        const transactions = await Transaction.find({date});
        res.json(transactions);
    } catch (err) {
        res.status(500).json({error: 'Błąd serwera.'});
    }
});

router.post('/', async (req, res) => {
    try {
        const {date, description, amount} = req.body;
        const transaction = new Transaction({date, description, amount});
        await transaction.save();

        res.json({
            message: 'Dodano transakcję.',
            transaction
        });
    } catch (err) {
        console.error('Błąd zapisu transakcji:', err);
        res.status(500).json({error: 'Błąd zapisu transakcji.'});
    }
});

router.post('/sync', async (req, res) => {
    try {
        const {transactions} = req.body;
        const results = [];

        for (const tx of transactions) {
            const {date, description, amount} = tx;

            const existingTx = await Transaction.findOne({
                date,
                description,
                amount
            });

            if (!existingTx) {
                const transaction = new Transaction({date, description, amount});
                await transaction.save();

                results.push({success: true, transaction});
            } else {
                existingTx.date = date;
                existingTx.description = description;
                existingTx.amount = amount;
                await existingTx.save();
                results.push({
                    success: false,
                    message: 'Istniejąca transakcja została nadpisana danymi z lokalnego bufora.'
                });
            }
        }

        res.json({message: 'Synchronizacja zakończona.', results});
    } catch (err) {
        console.error('Błąd synchronizacji transakcji:', err);
        res.status(500).json({error: 'Błąd synchronizacji transakcji.'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Transaction.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Nie znaleziono transakcji do usunięcia.' });
        }

        res.json({ message: 'Transakcja została usunięta.', id });
    } catch (err) {
        console.error('Błąd usuwania transakcji:', err);
        res.status(500).json({ error: 'Błąd serwera przy usuwaniu transakcji.' });
    }
});

module.exports = router;