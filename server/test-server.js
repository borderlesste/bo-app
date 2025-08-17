const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Test server working!', port: PORT });
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'API endpoint working' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});