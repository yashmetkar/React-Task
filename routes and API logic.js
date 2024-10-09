const express = require('express');
const router = express.Router();
const axios = require('axios');
const Transaction = require('./models/Transaction');

// Initialize database
router.get('/initialize-db', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const data = response.data;
    
    await Transaction.deleteMany({});
    await Transaction.insertMany(data);
    
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// List transactions
router.get('/transactions', async (req, res) => {
  try {
    const { month, search, page = 1, perPage = 10 } = req.query;
    
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
    
    let query = { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: parseFloat(search) || 0 }
      ];
    }
    
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .skip((parseInt(page) - 1) * parseInt(perPage))
      .limit(parseInt(perPage));
    
    res.json({
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Statistics
router.get('/statistics', async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

    const stats = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: '$price' },
          soldItems: { $sum: { $cond: ['$sold', 1, 0] } },
          notSoldItems: { $sum: { $cond: ['$sold', 0, 1] } }
        }
      }
    ]);

    res.json(stats[0] || { totalSaleAmount: 0, soldItems: 0, notSoldItems: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Bar chart data
router.get('/bar-chart', async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

    const ranges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity }
    ];

    const result = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: ranges.map(r => r.min),
          default: '901-above',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const chartData = ranges.map((range, index) => ({
      range: `${range.min}-${range.max === Infinity ? 'above' : range.max}`,
      count: (result.find(r => r._id === range.min) || { count: 0 }).count
    }));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bar chart data' });
  }
});

// Pie chart data
router.get('/pie-chart', async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

    const result = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pie chart data' });
  }
});

// Combined data
router.get('/combined-data', async (req, res) => {
  try {
    const { month } = req.query;

    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      Transaction.find({ $expr: { $eq: [{ $month: '$dateOfSale' }, new Date(`${month} 1, 2000`).getMonth() + 1] } }).limit(10),
      router.get('/statistics', { query: { month } }),
      router.get('/bar-chart', { query: { month } }),
      router.get('/pie-chart', { query: { month } })
    ]);

    res.json({
      transactions,
      statistics: statistics.json,
      barChart: barChart.json,
      pieChart: pieChart.json
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch combined data' });
  }
});

module.exports = router;