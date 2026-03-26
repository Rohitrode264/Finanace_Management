"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless_http_1 = __importDefault(require("serverless-http"));
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const dailyReport_job_1 = require("./jobs/dailyReport.job");
// Cache the serverless handler
let cachedHandler;
/**
 * AWS Lambda Handler
 */
const handler = async (event, context) => {
    // 1. Handle EventBridge (Cron) Triggers
    if (event.source === 'aws.events' || event['detail-type'] === 'Scheduled Event') {
        console.log('📅 Scheduled EventBridge trigger received');
        await (0, db_1.connectDB)();
        await (0, dailyReport_job_1.processDailyReport)(new Date().toISOString(), 'system-eventbridge');
        return { message: 'Daily report processed successfully' };
    }
    // 2. Handle API Gateway Requests (Express)
    if (!cachedHandler) {
        cachedHandler = (0, serverless_http_1.default)(app_1.default, {
        // Optional: specify middleware if needed
        });
    }
    // Ensure DB is connected before handling request
    await (0, db_1.connectDB)();
    return cachedHandler(event, context);
};
exports.handler = handler;
//# sourceMappingURL=lambda.js.map