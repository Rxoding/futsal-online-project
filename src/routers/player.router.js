import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 선수 목록 조회 API
router.get('/player', async (req, res, next) => {
  try {
    const playerList = await prisma.player.findMany({
      select: {
        playerId: true,
        playerName: true,
        rare: true,
        speed: true,
        finishing: true,
        pass: true,
        defense: true,
        stamina: true,
      },
    });
    return res.status(201).json({ playerList });
  } catch (err) {
    next(err);
  }
});

// 선수 상세 조회 API
router.get('/player/:playerId', async (req, res, next) => {
  const playerId = req.params.playerId;
  try {
    const playerInfo = await prisma.player.findUnique({
      where: { playerId: +playerId },
      select: {
        playerId: true,
        playerName: true,
        rare: true,
        speed: true,
        finishing: true,
        pass: true,
        defense: true,
        stamina: true,
      },
    });
    return res.status(201).json({ playerInfo });
  } catch (err) {
    next(err);
  }
});

// 게임 시작 API
router.post("/games/play", async (req, res, next) => {
  const { teamAIds, teamBIds, teamAName, teamBName } = req.body;

  try {
    const result = await startGame(teamAIds, teamBIds, teamAName, teamBName);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
