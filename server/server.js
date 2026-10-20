require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use(require('./middleware/errorHandler'));
const PORT = process.env.PORT || 5000;
connectDB().then(() =>
  app.listen(PORT, () => console.log('Server running on ' + PORT))
);