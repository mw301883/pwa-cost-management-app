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

router.get('/', async (req, res) => {
    try {
        let budgets = await Budget.find();

        if (!budgets || budgets.length === 0) {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const newBudget = await Budget.create({
                date: currentMonth,
                income: 0,
                expenses: 0,
            });

            budgets = [newBudget];
        }

        res.json(budgets);
    } catch (err) {
        console.error(err);
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
