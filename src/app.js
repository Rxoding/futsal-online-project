import express from 'express';
import cookieParser from 'cookie-parser';
import TeamRouter from './routes/team.router.js';
import userRouter from './routes/user.router.js';
//import dotenv from 'dotenv';

//dotenv.config();

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [userRouter, TeamRouter]);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});