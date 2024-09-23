import express from 'express';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.router.js';

const app = express();
const PORT = 3029;

app.use(express.json());
app.use(cookieParser());

app.use('/api', [userRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});