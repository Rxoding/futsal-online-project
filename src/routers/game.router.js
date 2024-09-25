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

    // 상대 정보 조회
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

    // 로스터 조회
    const rosterA = await prisma.userPlayer.findMany({
      where: { userId: +userId, teamId: 1 },
      select: {
        playerId: true,
        upgrade: true,
      },
    });
    console.log('로스터 A:', rosterA);
    const rosterB = await prisma.userPlayer.findMany({
      where: { userId: +opponent, teamId: 1 },
      select: {
        playerId: true,
        upgrade: true,
      },
    });
    console.log('로스터 B:', rosterB);

    // 로스터 유효성 검사
    if (rosterA.length < 3) {
      return res.status(400).json({ message: '팀 A는 최소 3명의 선수가 필요합니다.' });
    }
    if (rosterB.length < 3) {
      return res.status(400).json({ message: '팀 B는 최소 3명의 선수가 필요합니다.' });
    }

    // playerIds 배열 생성
    const playerIdsA = rosterA.map((player) => player.playerId);
    const playerIdsB = rosterB.map((player) => player.playerId);
    const upgradesA = rosterA.map((player) => player.upgrade);
    const upgradesB = rosterB.map((player) => player.upgrade);
    const teamAName = my.name + '의 팀'; // 사용자 이름을 팀 A 이름으로 사용s
    const teamBName = user.name + '의 팀'; // 사용자 이름을 팀 B 이름으로 사용
    const userAid = my.userId;
    const userBid = user.userId;
    const isfriendly = 1;

    const result = await startGame({
      teamAupgrade: upgradesA,
      teamBupgrade: upgradesB,
      teamAIds: playerIdsA,
      teamBIds: playerIdsB,
      teamAName, // 사용자 이름 기반의 팀 A 이름
      teamBName, // 사용자 이름 기반의 팀 B 이름
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
    console.error('Error in playgame:', error); // 에러 로그 출력
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

    // 자동 점수 매칭 시스템
    while (true) {
      console.log(range); // 10
      const opponent = await prisma.user.findFirst({
        where: {
          userId: {
            not: +myData.userId,
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
        opponentId = opponent.userId;
        break;
      }
    }
    console.log('test: ' + opponentId);
    // 상대 사용자 정보 조회
    const opponentUser = await prisma.user.findUnique({
      where: { userId: +opponentId },
      select: { accountId: true, userId: true, name: true },
    });
    if (!opponentUser) {
      return res.status(404).json({ message: '상대를 찾을 수 없습니다.' });
    }

    // 로스터 조회
    const rosterA = await prisma.userPlayer.findMany({
      where: { userId: userId, teamId: 1 },
      select: { playerId: true, upgrade: true },
    });
    console.log('로스터 A:', rosterA);
    const rosterB = await prisma.userPlayer.findMany({
      where: { userId: opponentId, teamId: 1 }, // 상대 로스터 조회
      select: { playerId: true, upgrade: true }, // upgrade 정보도 포함
    });
    console.log('로스터 B:', rosterB);

    // 로스터 유효성 검사
    if (rosterA.length < 3) {
      return res.status(400).json({ message: '팀 A는 최소 3명의 선수가 필요합니다.' });
    }
    if (rosterB.length < 3) {
      return res.status(400).json({ message: '팀 B는 최소 3명의 선수가 필요합니다.' });
    }

    // playerIds 배열 생성
    const playerIdsA = rosterA.map((player) => player.playerId);
    const playerIdsB = rosterB.map((player) => player.playerId);
    const upgradesA = rosterA.map((player) => player.upgrade);
    const upgradesB = rosterB.map((player) => player.upgrade);

    const teamAName = myData.name + '의 팀'; // 사용자 이름을 팀 A 이름으로 사용
    const teamBName = opponentUser.name + '의 팀'; // 사용자 이름을 팀 B 이름으로 사용

    const userAid = myData.userId;
    const userBid = opponentUser.userId;
    const result = await startGame({
      teamAupgrade: upgradesA,
      teamBupgrade: upgradesB,
      teamAIds: playerIdsA,
      teamBIds: playerIdsB,
      teamAName,
      teamBName,
      userAid,
      userBid,
      isfriendly: 0, //랭크전
    });
    // 결과 반환
    res.status(200).json({
      message: '게임이 시작되었습니다.',
      teamA: { playerIds: playerIdsA },
      teamB: { playerIds: playerIdsB },
      result,
    });
  } catch (error) {
    console.error('Error in playgame:', error); // 에러 로그 출력
    next(error); // 에러 처리 미들웨어로 넘김
  }
});

export default router;
