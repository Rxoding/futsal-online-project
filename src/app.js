import express from 'express';
import cookieParser from 'cookie-parser';
import PlayerRouter from './routers/player.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import UserRouter from './routers/user.router.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3029;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [PlayerRouter, UserRouter]);
app.use(LogMiddleware);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
