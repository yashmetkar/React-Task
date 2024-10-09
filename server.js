const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes and API logic');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/product_transactions', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});