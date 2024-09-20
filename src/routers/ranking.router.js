import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middleWares/auth.middleWare.js";

const router = express.Router();

// 랭킹 조회 API
router.get("/ranking", authMiddleware, async (res, req, next) => {
  const ranking = await prisma.user.findMany({
    select: {
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
      userScore: "desc",
    },
  });

  return res.status(200).json({ data: ranking });
});

export default router;
