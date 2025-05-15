// backend/server.js
//test witam michala
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
//const userRoutes = require("./routes/userRoutes");

dotenv.config();
const app = express();

const allowedOrigins = [ //TODO add later production URI
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
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));


//app.use("/api/users", userRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
