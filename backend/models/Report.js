const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    message: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model("Report", ReportSchema);
