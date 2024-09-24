import { Router } from 'express';
import { startGame } from './gameplay.js'; // 게임 로직이 들어있는 서비스 파일
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth/auth.middleware.js';

const router = Router();

router.post('/playgame', authMiddleware, async (req, res, next) => {
  try {
    const { teamAId, teamBId } = req.body;
    const { userId } = req.user;

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { userId: +userId },
      select: { accountId: true, name: true },
    });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const { accountId } = user;

    // 로스터 조회
    const rosterA = await prisma.userPlayer.findMany({
      where: { userId: userId },
      select: { playerId: true },
    });
    console.log('로스터 A:', rosterA);
    const rosterB = await prisma.userPlayer.findMany({
      where: { userId: userId },
      select: { playerId: true },
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

    const teamAName = user ? user.name + '의 팀' : '팀 A'; // 사용자 이름을 팀 A 이름으로 사용
    const teamBName = user ? user.name + '의 팀' : '팀 B'; // 사용자 이름을 팀 B 이름으로 사용

    const result = await startGame({
      teamAIds: playerIdsA,
      teamBIds: playerIdsB,
      teamAName, // 사용자 이름 기반의 팀 A 이름
      teamBName, // 사용자 이름 기반의 팀 B 이름
      teamAId, // 팀 A의 ID
      teamBId, // 팀 B의 ID
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
