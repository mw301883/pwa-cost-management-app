const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
    month: {
        type: String,
        required: true,
    },
    income: {
        type: Number,
        required: true,
        default: 0
    },
    expenses: {
        type: Number,
        required: true,
        default: 0
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
});

module.exports = mongoose.model("Budget", BudgetSchema);
