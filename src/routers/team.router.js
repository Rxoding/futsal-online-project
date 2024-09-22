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
    // 유저 정보 조회
    const user = await prisma.user.findFirst({
      where: { userId: +userId },
    });

    // 개런티가 80이면 1등급 확정
    if (user.guarantee >= 80) {
      const selectedPlayer = await getRandomPlayer(1);
      await prisma.user.update({
        where: { userId: +userId },
        data: { guarantee: 0 },
      });
    } else {
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

      // 1등급을 뽑으면 개런티 초기화
      if (rare === 1) {
        await prisma.user.update({
          where: { userId: +userId },
          data: { guarantee: 0 },
        });
      } else {
        // 아니면 개런티 +1
        await prisma.user.update({
          where: { userId: +userId },
          data: { guarantee: user.guarantee + 1 },
        });
      }
      const selectedPlayer = await getRandomPlayer(rare);
    }

    // 존재하지 않는 선수일 경우 에러 발생
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

// 강화 성공 여부 결정하는 함수
function isUpgradeSuccessed(upgrade) {
  const upgradeChances = [100, 81, 64, 50, 26, 15, 7, 4, 2, 1];

  const successChance = upgradeChances[upgrade];
  const random = Math.random() * 100;
  return random < successChance;
}

// 선수 강화 API
router.update('/upgrade/:userId/:playerId', authMiddleware, async (req, res, next) => {
  const { userId, playerId } = req.params;

  try {
    // 유저에게 해당 선수가 있는지 확인
    const userPlayer = await prisma.userPlayer.findFirst({
      where: {
        userId: +userId,
        playerId: +playerId,
      },
      include: {
        player: true,
      },
    });

    // 해당 선수가 없는 경우
    if (!userPlayer) {
      return res.status(404).json({ error: '해당 선수를 보유하고 있지 않습니다.' });
    }

    // 이미 최대 강화(10강)인 경우
    if (userPlayer.upgrade >= 10) {
      return res.status(400).json({ error: '이미 최대 강화에 도달하였습니다.' });
    }

    const requiredCount = userPlayer.upgrade + 1; // 강화에 필요한 카드 수 = 강화치 + 1

    // 강화 재료 부족한 경우
    if (userPlayer.count < requiredCount) {
      return res
        .status(400)
        .json({ error: `강화에 필요한 카드 수가 모자랍니다. (보유: ${userPlayer.count}, 필요: ${requiredCount})` });
    }

    // 강화 성공 여부
    const success = isUpgradeSuccessed(userPlayer.upgrade);

    if (success) {
      // 성공
      const updatedUserPlayer = await prisma.userPlayer.update({
        where: {
          Id: userPlayer.Id,
        },
        data: {
          upgrade: userPlayer.upgrade + 1,
          count: userPlayer.count - requiredCount,
          updatedAt: new Date(),
        },
      });

      // 선수 스탯 강화하는 부분인데, 선수 테이블을 건드려버리기 때문에 주석처리함. 아마 게임 로직 부분에서 구현해야 할 듯
      // const updatedUserPlayerStat = await prisma.player.update({
      //   where: {playerId : userPlayer.playerId},
      //   data: {
      //     speed: userPlayer.player.speed + 1,
      //     finishing: userPlayer.player.finishing + 1,
      //     pass: userPlayer.player.pass + 1,
      //     defense: userPlayer.player.defense + 1,
      //     stamina: userPlayer.player.stamina + 1,
      //   }
      // });

      return res.status(200).json({ message: '강화에 성공하였습니다!' });
    } else {
      // 실패
      const updatedUserPlayer = await prisma.userPlayer.update({
        where: { Id: userPlayer.Id },
        data: {
          count: userPlayer.count - requiredCount,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({ message: '강화에 실패하였습니다..' });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
