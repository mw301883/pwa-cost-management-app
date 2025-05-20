const express = require('express');
const router = express.Router();

const Budget = require('../models/Budget');

router.get('/:date', async (req, res) => {
    const dateParam = req.params.date;
    try {
        let budget = await Budget.findOne({ date: dateParam });
        if (!budget) {
            budget = await Budget.create({ date: dateParam, income: 0, expenses: 0 });
        }
        res.json(budget);
    } catch (err) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

router.put('/', async (req, res) => {
    try {
        const { date, income, expenses } = req.body;
        let budget = await Budget.findOne({ date: date });
        if (!budget) {
            budget = new Budget({ date, income, expenses });
        } else {
            budget.date = date;
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
