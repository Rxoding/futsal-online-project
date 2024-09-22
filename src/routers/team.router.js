import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middleWares/auth.middleWare.js';

const router = express.Router();

// 등급 내에서 랜덤한 선수를 뽑는 함수
async function getRandomPlayer(rare) {
  const players = await prisma.player.findMany({
    where: { rare: rare },
  });

  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
}

// 선수 뽑기 API
router.post('/gacha/:userId', authMiddleware, async (req, res, next) => {
  const { userId } = req.params;

  try {
    // 확률
    const probability = Math.random(0, 1);
    if (probability <= 0.02) {
      const rare = 1; // 2% 확률로 1등급
    } else if (probability <= 0.1) {
      const rare = 2; // 8% 확률로 2등급
    } else if (probability <= 0.3) {
      const rare = 3; // 20% 확률로 3등급
    } else if (probability <= 0.6) {
      const rare = 4; // 30% 확률로 4등급
    } else {
      const rare = 5; // 40% 확률로 5등급
    }

    // 존재하지 않는 선수일 경우 에러 발생
    const selectedPlayer = await getRandomPlayer(rare);

    if (!selectedPlayer) {
      return res.status(404).json({ error: '존재하지 않는 선수입니다.' });
    }

    const isExistUserPlayer = await prisma.userPlayer.findFirst({
      where: {
        userId: +userId,
        playerId: selectedPlayer.playerId,
      },
    });

    // 이미 보유하고 있는 선수인 경우 count +1
    if (isExistUserPlayer) {
      const updatedUserPlayer = await prisma.userPlayer.update({
        where: {
          Id: isExistUserPlayer.Id,
        },
        data: {
          count: isExistUserPlayer.count + 1,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        message: `${isExistUserPlayer.name}는 이미 보유하고 있어 강화재료로 변환되었습니다.`,
        player: selectedPlayer,
        userPlayer: updatedUserPlayer,
      });
    }

    // 새로운 선수 추가
    const newUserPlayer = await prisma.userPlayer.create({
      data: {
        userId: +userId,
        playerId: selectedPlayer.playerId,
        count: 1,
        upgrade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return res.status(201).json({
      message: '새로운 선수가 팀에 합류하였습니다!',
      player: selectedPlayer,
      userPlayer: newUserPlayer,
    });
  } catch (err) {
    next(err);
  }
});

router.update('/upgrade', async (req, res, next) => {});
