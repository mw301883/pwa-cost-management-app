const express = require('express');
const router = express.Router();

const Report = require('../models/Report');

router.get('/', async (req, res) => {
    try {
        let reports = await Report.find();
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

router.post('/', async (req, res) => {
    try {
        const report = new Report(req.body);
        await report.save();
        res.json({ message: 'Zapisano', report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd zapisu danych' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const reportId = req.params.id;
        const deletedReport = await Report.findByIdAndDelete(reportId);
        if (!deletedReport) {
            return res.status(404).json({ error: 'Raport nie znaleziony' });
        }
        res.json({ message: 'Raport usunięty', report: deletedReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd podczas usuwania raportu' });
    }
});


module.exports = router;
