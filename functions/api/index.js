const functions = require('firebase-functions');
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

exports.api = functions.https.onRequest(app);
