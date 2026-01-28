require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');

// Validate environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Error: Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://your-vercel-domain.vercel.app"
    ],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'MIMAR MODELS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong on the server',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
