const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

const allowedOrigins = [
    'https://cost-management-app.michal-wieczorek.pl',
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://frontend',
    'http://frontend:80'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS: ' + origin));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Połączono z MongoDB."))
    .catch((err) => console.log(err));

const transactionRouter = require('./router/transactionRouter'); 
const budgetRouter = require('./router/budgetRouter');
const reportRouter = require('./router/reportRouter');

app.use('/api/budget', budgetRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/reports', reportRouter);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Serwer został uruchomiony na porcie: ${PORT}`);
});
