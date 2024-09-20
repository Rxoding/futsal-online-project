import { prisma } from "../utils/prisma/index.js";

// 팀 점수 계산 함수
export function calculateScore(player) {
  const weights = {
    speed: 0.1,
    finishing: 0.25,
    pass: 0.15,
    defense: 0.3,
    stamina: 0.2,
  };
  return (
    player.speed * weights.speed +
    player.finishing * weights.finishing +
    player.pass * weights.pass +
    player.defense * weights.defense +
    player.stamina * weights.stamina
  );
}

// 랜덤 선수 선택 및 승패 결정
export async function startGame(teamAIds, teamBIds, teamAName, teamBName) {
  const playersA = await prisma.player.findMany({
    where: { playerId: { in: teamAIds } },
  });
  const playersB = await prisma.player.findMany({
    where: { playerId: { in: teamBIds } },
  });

  let scoreA = 0;
  let scoreB = 0;
  const gameLog = [];

  while (scoreA < 3 && scoreB < 3) {
    const randomPlayerA = playersA[Math.floor(Math.random() * playersA.length)];
    const randomPlayerB = playersB[Math.floor(Math.random() * playersB.length)];

    const playerScoreA = calculateScore(randomPlayerA);
    const playerScoreB = calculateScore(randomPlayerB);

    // 선수 점수 비교
    if (playerScoreA > playerScoreB) {
      scoreA++;
      gameLog.push({
        gameTime: `${Math.floor(Math.random() * 90) + 1}분`,
        goalTeam: teamAName,
        goalPlayer: randomPlayerA.playerName,
      });
    } else if (playerScoreB > playerScoreA) {
      scoreB++;
      gameLog.push({
        gameTime: `${Math.floor(Math.random() * 90) + 1}분`,
        goalTeam: teamBName,
        goalPlayer: randomPlayerB.playerName,
      });
    } else {
      // 스탯이 같을 경우 재경기
      continue; // 재경기 진행
    }
  }

  const winner = scoreA === 3 ? teamAName : scoreB === 3 ? teamBName : null;

  if (winner) {
    return {
      message: `${winner} 팀이 승리했습니다. 축하드립니다!`,
      result: `${teamAName} ${scoreA} : ${scoreB} ${teamBName}`,
      gameLog,
    };
  } else {
    // 패배 처리
    const losingTeam = scoreA < scoreB ? teamAName : teamBName;
    return {
      message: `${losingTeam} 팀이 패배했습니다. 좋은 선수로 구성해보세요!`,
      result: `${teamAName} ${scoreA} : ${scoreB} ${teamBName}`,
      gameLog,
    };
  }
}
