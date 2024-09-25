import { Router } from 'express';
import { startGame } from './gameplay.js'; // 게임 로직이 들어있는 서비스 파일
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth/auth.middleware.js';

const router = Router();

/** 친선전 API **/
router.post('/friendlymatch/:opponent', authMiddleware, async (req, res, next) => {
  try {
    // 상대 userId를 Opponent에 받음
    const { opponent } = req.params;
    const { userId } = req.user;

    // 내 정보 조회
    const my = await prisma.user.findUnique({
      where: { userId: +userId },
      select: { accountId: true, userId: true, name: true },
    });

    // 상대 정보 조회
    const user = await prisma.user.findUnique({
      where: { userId: +opponent },
      select: { accountId: true, userId: true, name: true },
    });
    if (!user) {
      return res.status(404).json({ message: '상대를 찾을 수 없습니다.' });
    }

    const userAid = my.userId;
    const userBid = user.userId;
    const teamAName = my.name + '의 팀';
    const teamBName = user.name + '의 팀';
    const isfriendly = 1;

    const result = await startGame({
      teamAName,
      teamBName,
      userAid,
      userBid,
      isfriendly,
    });
    // 결과 반환
    res.status(200).json({
      message: '게임이 시작되었습니다.',
      teamA: { playerIds: playerIdsA },
      teamB: { playerIds: playerIdsB },
      result,
    });
  } catch (error) {
    next(error); // 에러 처리 미들웨어로 넘김
  }
});

/* 랭크전 API*/
router.post('/playrank', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    let range = 10;
    let opponentId;
    // 자신 점수 조회
    const myData = await prisma.user.findUnique({
      where: { userId: +userId },
      select: { accountId: true, userId: true, name: true, userScore: true },
    });

    let excludedUserIds = [+myData.userId];
    // 자동 점수 매칭 시스템 (로스터 가진 상대만 찾음)
    while (true) {

      const opponent = await prisma.user.findFirst({
        where: {
          userId: {
            notIn: excludedUserIds,
          },
          userScore: {
            gte: myData.userScore - range,
            lte: myData.userScore + range,
          },
        },
      });
      if (!opponent) {
        range = range + 10;
      } else {
        const roster = await prisma.userPlayer.findMany({
          where: { userId: +opponent.userId, teamId: 1 },
          select: {
            playerId: true,
            upgrade: true,
          },
        });

        if (roster.length == 3) {
          opponentId = opponent.userId;
          break;
        } else {
          excludedUserIds.push(+opponent.userId);
        }
      }
    }

    // 상대 사용자 정보 조회
    const opponentUser = await prisma.user.findUnique({
      where: { userId: +opponentId },
      select: { accountId: true, userId: true, name: true },
    });
    if (!opponentUser) {
      return res.status(404).json({ message: '상대를 찾을 수 없습니다.' });
    }

    const userAid = myData.userId;
    const userBid = opponentUser.userId;
    const teamAName = myData.name + '의 팀';
    const teamBName = opponentUser.name + '의 팀';

    const result = await startGame({
      teamAName,
      teamBName,
      userAid,
      userBid,
      isfriendly: 0, //랭크전
    });
    // 결과 반환
    res.status(200).json({
      message: '게임이 시작되었습니다.',
      teamAName: teamAName,
      teamBName: teamBName,
      result,
    });
  } catch (error) {
    next(error); // 에러 처리 미들웨어로 넘김
  }
});


export default router;
