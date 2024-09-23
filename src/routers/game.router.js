import { Router } from "express";
import { startGame } from "./gameplay.js"; // 게임 로직이 들어있는 서비스 파일
import { prisma } from "../utils/prisma/index.js";

const router = Router();

router.post("/playgame", async (req, res, next) => {
  try {
    const { userId } = req.user;

    // 로스터 조회
    const rosterA = await prisma.userPlayer.findMany({
      where: { userId: +userId, teamId: 1 },
      select: {
        playerId: true,
      },
    });

    const rosterB = await prisma.userPlayer.findMany({
      where: { userId: +userId, teamId: 2 }, // 팀 B를 위한 로스터 조회
      select: {
        playerId: true,
      },
    });
    // 로스터 유효성 검사
    if (rosterA.length < 3 || rosterB.length < 3) {
      return res
        .status(400)
        .json({ message: "각 팀은 최소 3명의 선수가 필요합니다." });
    }

    const user = await prisma.user.findUnique({
      where: { id: +userId },
      select: { name: true },
    });

    const teamAName = user ? user.name + "의 팀" : "팀 A"; // 사용자 이름을 팀 A 이름으로 사용
    const teamBName = user ? user.name + "의 팀" : "팀 B"; // 사용자 이름을 팀 B 이름으로 사용

    const result = await startGame({
      teamAIds: rosterA.map((player) => player.playerId),
      teamBIds: rosterB.map((player) => player.playerId),
      teamAName, // 사용자 이름 기반의 팀 A 이름
      teamBName, // 사용자 이름 기반의 팀 B 이름
      teamAId: 1, // 팀 A의 ID
      teamBId: 2, // 팀 B의 ID
    });
    // 결과 반환
    res.status(200).json(result);
  } catch (error) {
    next(error); // 에러 처리 미들웨어로 넘김
  }
});

export default router;
