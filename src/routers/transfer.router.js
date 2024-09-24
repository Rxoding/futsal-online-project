import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth/auth.middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// 이적시장 등록 API
router.post('/transfer/register', authMiddleware, async (req, res, next) => {
  const { playerId, price } = req.body;
  const { userId } = req.user;
  try {
    // 유저 정보 가져오기
    const userPlayer = await prisma.userPlayer.findFirst({
      where: {
        userId: +userId,
        playerId: +playerId,
      },
    });
    // playerId에 해당하는 playerName,rare도 가져오기
    const player = await prisma.player.findFirst({
      where: { playerId: +playerId },
      select: { playerName: true, rare: true },
    });

    // 선수정보가 없는 경우
    if (!player) {
      return res.status(404).json({ error: '등록되지 않은 선수입니다.' });
    }

    // 존재하지 않는 선수일 경우 에러
    if (!userPlayer) {
      return res.status(404).json({ error: '존재하지 않는 선수입니다.' });
    }

    // 강화된 카드만 한장 남았을 때
    if (userPlayer.count === 0 && userPlayer.upgrade > 0) {
      return res.status(400).json({ error: '강화된 카드는 이적시장에 등록할 수 없습니다.' });
    }

    // rare에 따른 기준가
    const minimunPrices = {
      1: 10000,
      2: 8000,
      3: 6000,
      4: 4000,
      5: 2000,
    };

    const minPrice = minimunPrices[player.rare];

    console.log(minPrice);

    // 기준가 보다 등록 가격이 낮을때 에러 출력
    if (price < minPrice) {
      return res.status(400).json({
        error: `${player.rare}등급 선수의 등록가격은 최소 ${minPrice}원 이상이어야 합니다.`,
      });
    }

    // 선수 이적시장 등록, user의 선수count -1 동시에 하는 트랜잭션
    const [transferRegistration, userPlayerUpdate] = await prisma.$transaction(
      async (tx) => {
        // 이적시장 등록
        const transferRegistration = await tx.transferMarket.create({
          data: {
            sellerId: +userId,
            playerId: +playerId,
            price: +price,
          },
        });

        // user가 가지고 있는 선수 삭제
        if (userPlayer.count === 0) {
          // count가 0일 경우, 해당 userPlayer 삭제
          await tx.userPlayer.delete({
            where: {
              Id: +userPlayer.Id,
            },
          });
          return [transferRegistration, null]; // 삭제되었으므로 null 반환
        } else {
          // count가 0보다 클 경우, count 감소
          const userPlayerUpdate = await tx.userPlayer.update({
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
          return [transferRegistration, userPlayerUpdate];
        }
      },
      {
        // 트랙잭션 격리 수준
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return res.status(201).json({
      message: `${player.playerName}이(가) 이적시장에 등록되었습니다.`,
    });
  } catch (err) {
    next(err);
  }
});
// 이적시장 구매 API
router.patch('/transfer/purchase', authMiddleware, async (req, res, next) => {
  const { marketId } = req.body;
  const { userId } = req.user;
  try {
    // marketId에 따른 playerId 가져오기
    const transferMarket = await prisma.transferMarket.findFirst({
      where: {
        marketId: +marketId,
      },
      select: {
        playerId: true,
      },
    });

    // 선수 정보가 없을 경우
    if (!transferMarket) {
      return res.status(404).json({ error: '이적시장에 등록되지 않은 선수입니다.' });
    }

    const playerId = transferMarket.playerId;

    // playerId에 해당하는 playerName 가져오기
    const player = await prisma.player.findFirst({
      where: { playerId: +playerId },
      select: {
        playerName: true,
        rare: true,
        speed: true,
        finishing: true,
        pass: true,
        defense: true,
        stamina: true,
      },
    });

    // 선수정보가 없는 경우
    if (!player) {
      return res.status(404).json({ error: '등록되지 않은 선수입니다.' });
    }
    const [transferUpdate, purchasePlayer] = await prisma.$transaction(async (tx) => {
      // 이적시장 업데이트 (삭제)
      const transferUpdate = await tx.transferMarket.delete({
        where: {
          marketId: +marketId,
        },
      });

      // userPlayer 조회
      const userPlayer = await tx.userPlayer.findFirst({
        where: {
          userId: +userId,
          playerId: +playerId,
        },
      });

      // userPlayer가 존재하지 않는 경우 생성
      if (!userPlayer) {
        const newPlayer = await tx.userPlayer.create({
          data: {
            userId: +userId,
            playerId: +playerId,
            count: 0,
            updatedAt: new Date(),
          },
        });
        return [transferUpdate, newPlayer];
      } else {
        // userPlayer가 존재하는 경우 count 증가
        const updatedPlayer = await tx.userPlayer.update({
          where: {
            Id: +userPlayer.Id,
            userId: +userId,
            playerId: +playerId,
          },
          data: {
            count: userPlayer.count + 1,
            updatedAt: new Date(),
          },
        });
        return [transferUpdate, updatedPlayer];
      }
    });

    // 성공적으로 구매된 선수의 정보 응답
    return res.status(200).json({
      message: `${player.playerName}이(가) 구매되었습니다.`,
      player,
    });
  } catch (err) {
    next(err);
  }
});
// 이적시장 취소 API
router.patch('/transfer/cancel', authMiddleware, async (req, res, next) => {
  const { marketId } = req.body;
  const { userId } = req.user;
  try {
    // 등록된 카드
    const registeredPlayer = await prisma.transferMarket.findFirst({
      where: {
        marketId: +marketId,
      },
      select: {
        sellerId: true,
        playerId: true,
      },
    });
    // 등록한 유저
    const registeredUser = await prisma.userPlayer.findFirst({
      where: {
        userId: +userId,
      },
    });
    // 등록되지 않은 선수 일 경우
    if (!registeredPlayer) {
      return res.status(404).json({ error: '등록되지 않은 선수입니다.' });
    }
    // 등록한 유저가 아닐 경우
    if (userId !== registeredPlayer.sellerId) {
      return res.status(404).json({ error: '직접 등록한 선수만 취소할 수 있습니다.' });
    }
    // 등록된 선수 ID
    const playerId = registeredPlayer.playerId;

    // 선수 정보
    const player = await prisma.player.findFirst({
      where: { playerId: +playerId },
      select: {
        playerName: true,
        rare: true,
        speed: true,
        finishing: true,
        pass: true,
        defense: true,
        stamina: true,
      },
    });
    // 이적시장에서 선수 삭제 && 취소한 선수 userPlayer에 추가
    const [deletedRegisteredPlayer, updatedUserPlayer] = await prisma.$transaction(async (tx) => {
      // 이적시장 삭제
      const deletedRegisteredPlayer = await tx.transferMarket.delete({
        where: {
          marketId: +marketId,
        },
      });

      // userPlayer 조회
      const userPlayer = await tx.userPlayer.findFirst({
        where: {
          userId: +userId,
          playerId: +playerId,
        },
      });

      // userPlayer가 존재하지 않는 경우 생성
      if (!userPlayer) {
        const newPlayer = await tx.userPlayer.create({
          data: {
            userId: +userId,
            playerId: +playerId,
            count: 0,
            updatedAt: new Date(),
          },
        });
        return [deletedRegisteredPlayer, newPlayer];
      } else {
        // userPlayer가 존재하는 경우 count 증가
        const updatedPlayer = await tx.userPlayer.update({
          where: {
            Id: +userPlayer.Id,
            userId: +userId,
            playerId: +playerId,
          },
          data: {
            count: userPlayer.count + 1,
            updatedAt: new Date(),
          },
        });
        return [deletedRegisteredPlayer, updatedPlayer];
      }
    });

    // 성공적으로 구매된 선수의 정보 응답
    return res.status(200).json({
      message: `${player.playerName}이(가) 등록 취소 되었습니다.`,
      player,
    });
  } catch (err) {
    next(err);
  }
});
// 이적시장 목록 조회 API
router.get('/transfer/list', authMiddleware, async (req, res, next) => {
  try {
    // User-name, Player-playerName 가져오기
    const importName = await prisma.transferMarket.findMany({
      include: {
        seller: {
          select: {
            name: true,
          },
        },
        player: {
          select: {
            playerName: true,
          },
        },
      },
    });
    // 필요한 형식으로 mapping
    const transferMarket = importName.map((item) => ({
      marketId: item.marketId,
      sellerId: item.sellerId,
      sellerName: item.seller.name,
      playerId: item.playerId,
      playerName: item.player.playerName,
      price: item.price,
    }));

    return res.status(200).json(transferMarket);
  } catch (err) {
    next(err);
  }
});

// 퀵셀 API (count 소모)
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
    const pricePerRare = [5000, 4000, 3000, 2000, 1000];
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
