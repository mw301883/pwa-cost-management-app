const express = require('express');
const router = express.Router();

const Budget = require('../models/Budget');

router.get('/', async (req, res) => {
    try {
        let budget = await Budget.findOne();
        if (!budget) {
            budget = await Budget.create({ income: 0, expenses: 0 });
        }
        res.json(budget);
    } catch (err) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

router.put('/', async (req, res) => {
    try {
        const { income, expenses } = req.body;
        let budget = await Budget.findOne();
        if (!budget) {
            budget = new Budget({ income, expenses });
        } else {
            budget.income = income;
            budget.expenses = expenses;
        }
        await budget.save();
        res.json({ message: 'Zapisano', budget });
    } catch (err) {
        res.status(500).json({ error: 'Błąd zapisu danych' });
    }
});

module.exports = router;
