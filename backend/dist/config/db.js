"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const env_1 = require("./env");
let isConnected = false;
async function connectDB() {
    try {
        // Reuse existing connection
        if (isConnected && mongoose_1.default.connection.readyState === 1) {
            return mongoose_1.default;
        }
        // Fix Windows/local router DNS querySrv ECONNREFUSED issues
        // when using mongodb+srv://
        try {
            dns_1.default.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
            console.log("Using custom DNS servers.");
        }
        catch (dnsErr) {
            console.warn("Could not set custom DNS servers:", dnsErr);
        }
        if (!env_1.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in the environment.");
        }
        const connection = await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        isConnected = true;
        console.log(`✅ MongoDB connected successfully: ${connection.connection.host}`);
        // Register listeners only once
        if (mongoose_1.default.connection.listenerCount("disconnected") === 0) {
            mongoose_1.default.connection.on("disconnected", () => {
                console.warn("⚠️ MongoDB disconnected.");
                isConnected = false;
            });
            mongoose_1.default.connection.on("error", (err) => {
                console.error("❌ MongoDB error:", err);
            });
        }
        return connection;
    }
    catch (error) {
        isConnected = false;
        console.error("❌ Error connecting to MongoDB:");
        if (error instanceof Error) {
            console.error(error.message);
        }
        else {
            console.error(error);
        }
        throw error;
    }
}
//# sourceMappingURL=db.js.map