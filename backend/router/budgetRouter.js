const express = require('express');
const router = express.Router();

const Budget = require('../models/Budget');

router.get(':/month', async (req, res) => {
    try {
        const { month } = req.params.month
        let budget = await Budget.findOne({ month });
        if(!budget) {
            budget = await Budget.create({ month, income: 0, expenses: 0 });
        }
        res.json(budget);
    }
    catch (err) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

router.put(':/month', async (req, res) => {
    try{
        const { month } = req.params;
       // const month = req.params.month;
        const { income, expenses } = req.body;
        let budget = await Budget.findOne({ month });

        if(!budget){
            const previous = await Budget.find().sort({ month: -1 }).limit(1);
            const previousTotalSaved = previous.length  ? previous[0].balance : 0;
            budget = new Budget({
                month,
                income,
                expenses,
                balance: previousTotalSaved + (income - expenses)
            });
        }
        else{
            const allPrevious = await Budget.find({month: { $lt: month }}).sort({ month: -1 });
            const prevTotal = allPrevious.reduce((sum, b) => sum + (b.income - b.expenses), 0);
            budget.income = income;
            budget.expenses = expenses;
            budget.balance = prevTotal + (income - expenses);
        }

        await budget.save();
        res.json({ message: 'Zapisano', budget });
    } catch (err) {
        res.status(500).json({ error: 'Błąd zapisu danych' });
    }

});

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
