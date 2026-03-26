import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export async function connectDB(): Promise<void> {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI!);

        isConnected = true;
        console.log(`MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected.');
            isConnected = false;
        });

    } catch (err) {
        console.error(`MongoDB connection failed:`, err);
        isConnected = false;
        // Don't process.exit(1) in Lambda; throw the error so the invocation fails
        throw err;
    }
}
