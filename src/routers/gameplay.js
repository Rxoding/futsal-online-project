import { prisma } from '../utils/prisma/index.js';

// 팀 점수 계산 함수
export function calculateScore(player, upgrade) {
  const weights = {
    speed: 0.1,
    finishing: 0.25,
    pass: 0.15,
    defense: 0.3,
    stamina: 0.2,
  };
  return (
    (player.speed + upgrade) * weights.speed +
    (player.finishing + upgrade) * weights.finishing +
    (player.pass + upgrade) * weights.pass +
    (player.defense + upgrade) * weights.defense +
    (player.stamina + upgrade) * weights.stamina
  );
}

// 승리 및 패배 카운트 업데이트 함수
async function updateTeamStats(winningTeamId, losingTeamId, drawCount) {
  try {
    // draw가 아닐때
    if (drawCount == 0) {
      console.log(`통계 업데이트 중 우승 팀 ID : ${winningTeamId}, 패배 팀 ID: ${losingTeamId}`);

      // 승리한 팀의 현재 점수 가져오기
      const winningTeam = await prisma.score.findUnique({
        where: { userId: +winningTeamId },
      });

      // 패배한 팀의 현재 점수 가져오기
      const losingTeam = await prisma.score.findUnique({
        where: { userId: +losingTeamId },
      });

      if (!winningTeam || !losingTeam) {
        throw new Error(`팀의 점수를 찾을 수 없습니다.`);
      }

      // 승리한 팀의 점수 증가
      await prisma.user.update({
        where: { userId: winningTeamId },
        data: { userScore: { increment: 10 } } // +10점
      });
      await prisma.score.update({
        where: { userId: winningTeamId },
        data: { win: { increment: 1 } }       // win +1
      });

      // 패배한 팀의 점수 감소
      await prisma.user.update({
        where: { userId: losingTeamId },
        data: { userScore: { decrement: 10 } } // -10점
      });
      await prisma.score.update({
        where: { userId: losingTeamId },
        data: { lose: { increment: 1 } } // lose +1 
      });
    } else {    // draw일때 
      // 두팀 다 draw +1, 점수 감소는 없음
      await prisma.score.update({
        where: { userId: winningTeamId },
        data: { draw: { increment: 1 } }       // draw +1
      });
      await prisma.score.update({
        where: { userId: losingTeamId },
        data: { draw: { increment: 1 } }       // draw +1
      });
    }
  } catch (error) {
    console.error('Error updating team stats:', error);
    throw new Error('팀 통계 업데이트 실패');
  }
}

// 랜덤 선수 선택 및 승패 결정
export async function startGame(roster) {
  const { teamAupgrade, teamBupgrade, teamAIds, teamBIds, teamAName, teamBName, userAid, userBid, isfriendly } =
    roster;

  const playersA = await prisma.player.findMany({
    where: { playerId: { in: teamAIds } },
  });
  const playersB = await prisma.player.findMany({
    where: { playerId: { in: teamBIds } },
  });

  let count = 5;
  let scoreA = 0;
  let scoreB = 0;
  let draws = 0;
  let winner = null;
  const gameLog = [];
  const gameTimes = [];

  // 경기가 끝날 때까지 계속 진행
  while (count > 0) {
    const randomA = Math.floor(Math.random() * teamAIds.length);
    const randomB = Math.floor(Math.random() * teamBIds.length);

    const randomPlayerA = playersA[randomA];
    const randomPlayerB = playersB[randomB];

    const playerScoreA = calculateScore(randomPlayerA, parseInt(teamAupgrade[randomA]));
    const playerScoreB = calculateScore(randomPlayerB, parseInt(teamBupgrade[randomB]));

    let gameTime;
    if (scoreA + scoreB === 0) {
      gameTime = Math.floor(Math.random() * 11); // 0~10분
    } else if (scoreA + scoreB === 1) {
      gameTime = Math.floor(Math.random() * (40 - 10 + 1)) + 10; // 10~40분
    } else if (scoreA + scoreB === 2) {
      gameTime = Math.floor(Math.random() * (60 - 40 + 1)) + 40; // 40~60분
    } else if (scoreA + scoreB === 3) {
      gameTime = Math.floor(Math.random() * (80 - 60 + 1)) + 60; // 60~80분
    } else if (scoreA + scoreB === 4) {
      gameTime = Math.floor(Math.random() * (90 - 80 + 1)) + 80; // 80~90분
    }
    gameTimes.push(gameTime); // 시간을 배열에 저장

    // 선수 점수 비교
    if (playerScoreA > playerScoreB) {
      scoreA++;
      gameLog.push({
        gameTime: `${gameTime}분`,
        goalTeam: teamAName,
        goalPlayer: randomPlayerA.playerName,
      });
    } else if (playerScoreB > playerScoreA) {
      scoreB++;
      gameLog.push({
        gameTime: `${gameTime}분`,
        goalTeam: teamBName,
        goalPlayer: randomPlayerB.playerName,
      });
    } else {
      draws++;
      gameLog.push({
        gameTime: `${gameTime}분`,
        goalTeam: '무승부',
        goalPlayer: '양 팀 선수 모두가 막상막하네요.',
      });
    }
    count--;
  }
  for (let i = 0; i < gameLog.length; i++) {
    gameLog[i].gameTime = `${gameTimes[i]}분`;
  }
  gameLog.sort((a, b) => {
    const timeA = parseInt(a.gameTime);
    const timeB = parseInt(b.gameTime);
    return timeA - timeB;
  });

  // 게임 결과 반환 및 승패 카운트 업데이트
  if (isfriendly != 1) {
    if (scoreA > scoreB) {
      // A팀 승리, B팀 패배
      winner = teamAName;
      await updateTeamStats(userAid, userBid, 0);
    } else if (scoreA < scoreB) {
      // B팀 승리, A팀 패배
      winner = teamBName;
      await updateTeamStats(userBid, userAid, 0);
    } else {
      // 무승부
      await updateTeamStats(userBid, userAid, 1);
    }
  }
  if (winner != null) {
    return {
      message: `${winner} 팀이 승리했습니다. 축하드립니다!`,
      result: `${teamAName} ${scoreA} - ${scoreB} ${teamBName}`,
      gameLog,
    };
  } else {
    return {
      message: `무승부로 경기가 끝났습니다.`,
      result: `${teamAName} ${scoreA} - ${scoreB} ${teamBName}`,
      gameLog,
    };
  }
}
