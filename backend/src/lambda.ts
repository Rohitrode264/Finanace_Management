import serverless from 'serverless-http';
import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import app from './app';
import { connectDB } from './config/db';
import { processDailyReport } from './jobs/dailyReport.job';

// Cache the serverless handler
let cachedHandler: any;

/**
 * AWS Lambda Handler
 */
export const handler = async (event: any, context: Context) => {
    // 1. Handle EventBridge (Cron) Triggers
    if (event.source === 'aws.events' || event['detail-type'] === 'Scheduled Event') {
        console.log('📅 Scheduled EventBridge trigger received');
        await connectDB();
        await processDailyReport(new Date().toISOString(), 'system-eventbridge');
        return { message: 'Daily report processed successfully' };
    }

    // 2. Handle API Gateway Requests (Express)
    if (!cachedHandler) {
        cachedHandler = serverless(app, {
            // Optional: specify middleware if needed
        });
    }

    // Ensure DB is connected before handling request
    await connectDB();

    return cachedHandler(event, context);
};
