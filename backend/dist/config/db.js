"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
async function connectDB() {
    if (isConnected && mongoose_1.default.connection.readyState === 1) {
        return;
    }
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log(`MongoDB connected: ${conn.connection.host}`);
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected.');
            isConnected = false;
        });
    }
    catch (err) {
        console.error(`MongoDB connection failed:`, err);
        isConnected = false;
        // Don't process.exit(1) in Lambda; throw the error so the invocation fails
        throw err;
    }
}
//# sourceMappingURL=db.js.map