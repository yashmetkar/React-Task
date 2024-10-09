import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function App() {
  const [month, setMonth] = useState('March');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({
    transactions: { transactions: [], total: 0, page: 1, perPage: 10 },
    statistics: { totalSaleAmount: 0, soldItems: 0, notSoldItems: 0 },
    barChart: [],
    pieChart: []
  });

  useEffect(() => {
    fetchData();
  }, [month, search, page]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/combined-data?month=${month}&search=${search}&page=${page}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const barChartData = {
    labels: data.barChart.map(item => item.range),
    datasets: [
      {
        label: 'Number of Items',
        data: data.barChart.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const pieChartData = {
    labels: data.pieChart.map(item => item._id),
    datasets: [
      {
        data: data.pieChart.map(item => item.count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
      },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Transaction Dashboard</h1>
      
      <div className="mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mr-2 p-2 border rounded"
        >
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions"
          className="p-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Total Sale Amount</h2>
          <p>${data.statistics.totalSaleAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Total Sold Items</h2>
          <p>{data.statistics.soldItems}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Total Not Sold Items</h2>
          <p>{data.statistics.notSoldItems}</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Transactions</h2>
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Title</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Sold</th>
              <th className="border p-2">Date of Sale</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.transactions.map(transaction => (
              <tr key={transaction.id}>
                <td className="border p-2">{transaction.id}</td>
                <td className="border p-2">{transaction.title}</td>
                <td className="border p-2">{transaction.description}</td>
                <td className="border p-2">${transaction.price.toFixed(2)}</td>
                <td className="border p-2">{transaction.category}</td>
                <td className="border p-2">{transaction.sold ? 'Yes' : 'No'}</td>
                <td className="border p-2">{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={page * data.transactions.perPage >= data.transactions.total}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Price Range Distribution</h2>
          <Bar data={barChartData} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Category Distribution</h2>
          <Pie data={pieChartData} />
        </div>
      </div>
    </div>
  );
}