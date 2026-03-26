import express from 'express';
import { configDotenv } from 'dotenv';

configDotenv();
const app = express();


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})