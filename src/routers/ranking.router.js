import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth/auth.middleware.js';

const router = express.Router();

// 랭킹 조회 API
router.get('/ranking', async (req, res, next) => {
  try {
    const ranking = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        userScore: true,
        score: {
          select: {
            win: true,
            lose: true,
            draw: true,
          },
        },
      },
      orderBy: {
        userScore: 'desc',
      },
    });

    return res.status(200).json({ data: ranking });
  } catch (err) {
    next(err);
  }
});

export default router;
