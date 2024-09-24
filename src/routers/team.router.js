import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth/auth.middleware.js';

const router = express.Router();

/** 보유 선수 조회 API **/
router.get('/userPlayer', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const userPlayer = await prisma.userPlayer.findMany({
    where: { userId: +userId },
    select: {
      playerId: true,
      upgrade: true,
      teamId: true,
      count: true,
      player: {
        // 1:1 관계를 맺고있는 Player 테이블을 조회합니다.
        select: {
          playerName: true,
        },
      },
    },
  });

  return res.status(200).json({ data: userPlayer });
});

/** 보유 선수 상세조회 API **/
router.get('/userPlayer/:playerId', authMiddleware, async (req, res, next) => {
  const { playerId } = req.params;
  const { userId } = req.user;
  const player = await prisma.userPlayer.findFirst({
    where: {
      playerId: +playerId,
      userId: +userId,
    },
    select: {
      playerId: true,
      upgrade: true,
      teamId: true,
      player: {
        // 1:1 관계를 맺고있는 Player 테이블을 조회합니다.
        select: {
          playerName: true,
          rare: true,
          speed: true,
          finishing: true,
          pass: true,
          defense: true,
          stamina: true,
        },
      },
    },
  });
  if (player.upgrade > 0) {
    player.player.speed = player.player.speed + player.upgrade;
    player.player.finishing = player.player.finishing + player.upgrade;
    player.player.pass = player.player.pass + player.upgrade;
    player.player.defense = player.player.defense + player.upgrade;
    player.player.stamina = player.player.stamina + player.upgrade;
  }
  return res.status(200).json({ data: player });
});

/** 로스터 조회 API **/
router.get('/roster', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const roster = await prisma.userPlayer.findMany({
    where: { userId: +userId, teamId: 1 },
    select: {
      playerId: true,
      upgrade: true,
      player: {
        // 1:1 관계를 맺고있는 Player 테이블을 조회합니다.
        select: {
          playerName: true,
        },
      },
    },
  });

  return res.status(200).json({ data: roster });
});

/** 로스터 변경 API **/
router.put('/roster', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { roster } = req.body;
    let set = new Set(roster.split(','));
    let playerIds = [...set];

    if (playerIds.length != 3)
      return res
        .status(401)
        .json({ message: '로스터는 중복되지 않는 3명을 지정해야합니다.' });

    const result = await prisma.$transaction(async (tx) => {
      const teaminit = await tx.userPlayer.updateMany({
        where: { userId: +userId, teamId: 1 },
        data: {
          teamId: null,
        },
      });

      for (let i = 0; i < playerIds.length; i++) {
        const isExistplayercode = await tx.userPlayer.findFirst({
          where: {
            userId: userId,
            playerId: +playerIds[i],
          },
        });

        if (isExistplayercode) {
          const user = await tx.userPlayer.update({
            where: { userId: +userId, Id: isExistplayercode.Id },
            data: {
              teamId: 1,
            },
          });
        } else {
          throw new Error('로스터 변경 트랜잭션 실패');
        }
      }
    });

    return res.status(200).json({ message: '로스터를 수정했습니다.' });
  } catch (err) {
    next(err);
  }
});

// 등급 내에서 랜덤한 선수를 뽑는 함수
async function getRandomPlayer(rare) {
  const players = await prisma.player.findMany({
    where: { rare: rare },
  });

  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
}

function getRandomRare() {
  const random = Math.random() * 100;

  if (random < 2) {
    return 1; // 2%
  } else if (random < 10) {
    return 2; // 8%
  } else if (random < 30) {
    return 3; // 20%
  } else if (random < 60) {
    return 4; // 30%
  } else {
    return 5; // 40%
  }
}

// 선수 뽑기 API
router.get('/gacha', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  try {
    // 유저 정보 조회
    const user = await prisma.user.findFirst({
      where: { userId: +userId },
    });

    // 캐시가 부족하면 에러 발생
    if (user.cash < 100) {
      return res.status(400).json({ error: '캐시가 부족합니다!' });
    }

    // 캐시 -1000
    await prisma.user.update({
      where: { userId: +userId },
      data: { cash: user.cash - 100 },
    });

    let selectedPlayer;

    // 개런티가 80이면 1등급 확정
    if (user.guarantee >= 80) {
      selectedPlayer = await getRandomPlayer(1);
      console.log(selectedPlayer);
      await prisma.user.update({
        where: { userId: +userId },
        data: { guarantee: 0 },
      });
    } else {
      // 확률
      const rare = getRandomRare();

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
      selectedPlayer = await getRandomPlayer(rare);
      console.log(selectedPlayer);
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
        message: `이미 보유하고 있는 선수를 뽑아 강화재료로 변환되었습니다.`,
        player: selectedPlayer,
      });
    }

    // 새로운 선수 추가
    const newUserPlayer = await prisma.userPlayer.create({
      data: {
        userId: +userId,
        playerId: selectedPlayer.playerId,
        count: 0,
        upgrade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return res.status(201).json({
      message: '새로운 선수가 팀에 합류하였습니다!',
      player: selectedPlayer,
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
router.post('/upgrade/:playerId', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const { playerId } = req.params;

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
      return res
        .status(404)
        .json({ error: '해당 선수를 보유하고 있지 않습니다.' });
    }

    // 이미 최대 강화(10강)인 경우
    if (userPlayer.upgrade >= 10) {
      return res
        .status(400)
        .json({ error: '이미 최대 강화에 도달하였습니다.' });
    }

    const requiredCount = userPlayer.upgrade + 1; // 강화에 필요한 카드 수 = 강화치 + 1

    // 강화 재료 부족한 경우
    if (userPlayer.count < requiredCount) {
      return res.status(400).json({
        error: `강화에 필요한 카드 수가 모자랍니다. (보유: ${userPlayer.count}, 필요: ${requiredCount})`,
      });
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

// 카드 판매 API (count 소모)
router.patch('/userPlayer/:playerId', authMiddleware, async (req, res, next) => {
  const { playerId } = req.params;
  const { userId } = req.user;

  try {
    // 유저 정보 가져오기
    const user = await prisma.user.findFirst({
      where: { userId: +userId },
    });

    const userPlayer = await prisma.userPlayer.findFirst({
      where: {
        userId: +userId,
        playerId: +playerId,
      },
    });

    // 존재하지 않는 선수일 경우 에러
    if (!userPlayer) {
      return res.status(401).json({ error: '존재하지 않는 선수입니다.' });
    }

    // 판매할 수 있는 카드가 없으면 에러
    if (userPlayer.count < 1) {
      return res.status(401).json({ error: '판매할 수 있는 카드가 없습니다.' });
    }

    // 선수의 count - 1
    await prisma.userPlayer.update({
      where: {
        Id: +userPlayer.Id,
        userId: +userId,
        playerId: +playerId,
      },
      data: {
        count: userPlayer.count - 1,
        updatedAt: new Date(),
      },
    });

    // 판매한 선수의 레어도에 따라 유저에게 캐쉬 지급
    const player = await prisma.player.findFirst({
      where: { playerId: +playerId },
    });
    const rare = player.rare;
    const pricePerRare = [1000, 800, 200, 100, 50];
    const curCash = user.cash + pricePerRare[rare - 1];

    await prisma.user.update({
      where: { userId: +userId },
      data: { cash: +curCash },
    });

    return res.status(200).json({ message: `카드 판매 완료! (cash + ${pricePerRare[rare - 1]})` });
  } catch (err) {
    next(err);
  }
});

export default router;
