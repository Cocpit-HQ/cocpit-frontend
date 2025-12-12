// mock-server.js
const express = require('express');
const app = express();
app.use(express.json());

const taken = new Set(['admin','test','john']);

app.get('/api/users/check-username', (req, res) => {
  const username = (req.query.username || '').toLowerCase();
  res.json({ available: !taken.has(username) });
});

app.listen(4000, () => console.log('Mock server listening on http://localhost:4000'));
