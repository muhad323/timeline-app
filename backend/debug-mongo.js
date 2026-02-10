require('dotenv').config();
const mongoose = require('mongoose');

console.log("Attempting to connect to MongoDB...");
console.log("URI:", process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s
        });
        console.log("Success! Connected to MongoDB.");
        process.exit(0);
    } catch (error) {
        console.error("Connection Failed!");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.reason) console.error("Reason:", error.reason);
        process.exit(1);
    }
};

connect();
