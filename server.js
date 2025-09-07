const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import CORS
const morgan = require('morgan'); // Logging middleware

const app = express();
const PORT = 3097;

// Middleware for CORS
app.use(cors({
    origin: '*', // Adjust origin as needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Middleware for parsing JSON
app.use(morgan('dev')); // Logging middleware

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/templeBookingsDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if connection fails
    });

// Define Booking schema
const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    temple: { type: String, required: true }
});

// Create Booking model
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware for validating booking data
const validateBooking = (req, res, next) => {
    const { name, email, date, time, temple } = req.body;

    // Basic field validation
    if (!name || !email || !date || !time || !temple) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof temple !== 'string') {
        return res.status(400).json({ success: false, message: 'Name, email, and temple must be strings' });
    }

    // Validate date format
    if (isNaN(Date.parse(date))) {
        return res.status(400).json({ success: false, message: 'Date must be a valid ISO date string' });
    }

    // Validate time format (HH:MM 24-hour format)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
        return res.status(400).json({ success: false, message: 'Time must be in HH:MM 24-hour format' });
    }

    next();
};

// Create a new booking
app.post('/api/bookings', validateBooking, async (req, res) => {
    try {
        const { name, email, date, time, temple } = req.body;

        const newBooking = new Booking({ name, email, date, time, temple });
        await newBooking.save();

        res.status(201).json({
            success: true,
            data: newBooking,
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Error creating booking:', error.message);
        res.status(500).json({ success: false, message: 'Server error while creating booking' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Graceful shutdown for MongoDB connection
process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
