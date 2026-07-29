import mongoose from "mongoose";
import dns from "dns";
import { env } from "./env";

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
    try {
        // Reuse existing connection
        if (isConnected && mongoose.connection.readyState === 1) {
            return mongoose;
        }

        // Fix Windows/local router DNS querySrv ECONNREFUSED issues
        // when using mongodb+srv://
        try {
            dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
            console.log("Using custom DNS servers.");
        } catch (dnsErr) {
            console.warn("Could not set custom DNS servers:", dnsErr);
        }

        if (!env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in the environment.");
        }

        const connection = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });

        isConnected = true;

        console.log(
            `✅ MongoDB connected successfully: ${connection.connection.host}`
        );

        // Register listeners only once
        if (mongoose.connection.listenerCount("disconnected") === 0) {
            mongoose.connection.on("disconnected", () => {
                console.warn("⚠️ MongoDB disconnected.");
                isConnected = false;
            });

            mongoose.connection.on("error", (err) => {
                console.error("❌ MongoDB error:", err);
            });
        }

        return connection;
    } catch (error) {
        isConnected = false;

        console.error("❌ Error connecting to MongoDB:");

        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }

        throw error;
    }
}