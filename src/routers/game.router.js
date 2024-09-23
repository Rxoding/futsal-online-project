import { Router } from "express";
import { startGame } from "../gameplay.js"; // 게임 로직이 들어있는 서비스 파일

const router = Router();

router.post("/playgame", async (req, res, next) => {
  try {
    const { teamAIds, teamBIds, teamAName, teamBName } = req.body;

    // 필수 값 확인
    if (!teamAIds || !teamBIds || !teamAName || !teamBName) {
      return res.status(400).json({ message: "팀 정보가 부족합니다." });
    }

    // startGame 호출 및 결과 받기
    const result = await startGame(teamAIds, teamBIds, teamAName, teamBName);

    // 결과 반환
    res.status(200).json(result);
  } catch (error) {
    next(error); // 에러 처리 미들웨어로 넘김
  }
});

export default router;
