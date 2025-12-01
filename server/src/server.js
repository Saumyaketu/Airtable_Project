require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes); 
app.use('/api/webhooks', webhookRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch(err => console.error(err));