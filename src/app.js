import express from 'express';
import cookieParser from 'cookie-parser';

import LogMiddleware from './middlewares/log.middleware.js';
import rankingRouter from './routers/ranking.router.js';
import PlayerRouter from './routers/player.router.js';
import gameRouter from './routers/game.router.js';
import teamRouter from './routers/team.router.js';
import userRouter from './routers/user.router.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3029;

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api', [userRouter, teamRouter, PlayerRouter, gameRouter, rankingRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});