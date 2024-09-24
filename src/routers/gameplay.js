import { prisma } from '../utils/prisma/index.js';

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

// 데이터 삽입 함수
async function insertInitialData(userId) {
  try {
    const existingScore = await prisma.score.findUnique({
      where: { userId },
    });

    if (!existingScore) {
      await prisma.score.create({
        data: {
          userId,
          win: 0,
          lose: 0,
          draw: 0,
          // points: 1000, // 기본 점수 1000
        },
      });
      console.log('초기 데이터가 삽입되었습니다. userId:', userId);
    } else {
      console.log('해당 userId의 데이터가 이미 존재합니다.');
    }
  } catch (error) {
    console.error('데이터 삽입 오류:', error);
  }
}

// 승리 및 패배 카운트 업데이트 함수
async function updateTeamStats(winningTeamId, losingTeamId) {
  console.log(
    `Updating stats for Winning Team ID: ${winningTeamId}, Losing Team ID: ${losingTeamId}`,
  );

  try {
    // 승리한 팀의 현재 점수 가져오기
    const winningTeam = await prisma.score.findUnique({
      where: { userId: winningTeamId },
    });

    // 패배한 팀의 현재 점수 가져오기
    const losingTeam = await prisma.score.findUnique({
      where: { userId: losingTeamId },
    });

    if (!winningTeam || !losingTeam) {
      throw new Error(`팀의 점수를 찾을 수 없습니다.`);
    }

    // 승리한 팀의 점수 증가
    await prisma.score.update({
      where: { userId: winningTeamId },
      data: { win: { increment: 1 } }, //points: { increment: 10 } }, // +10점
    });

    // 패배한 팀의 점수 감소
    await prisma.score.update({
      where: { userId: losingTeamId },
      data: { lose: { increment: 1 } }, //points: { decrement: 10 } }, // -10점
    });
  } catch (error) {
    console.error('Error updating team stats:', error);
    throw new Error('팀 통계 업데이트 실패');
  }
}

// 랜덤 선수 선택 및 승패 결정
export async function startGame(roster) {
  const { teamAIds, teamBIds, teamAName, teamBName, teamAId, teamBId } = roster;

  console.log('Team A ID:', teamAId);
  console.log('Team B ID:', teamBId);

  const playersA = await prisma.player.findMany({
    where: { playerId: { in: teamAIds } },
  });
  const playersB = await prisma.player.findMany({
    where: { playerId: { in: teamBIds } },
  });

  const MAX_SCORE = 3;
  let scoreA = 0;
  let scoreB = 0;
  let draws = 0;
  const gameLog = [];

  // 경기가 끝날 때까지 계속 진행
  while (scoreA < MAX_SCORE && scoreB < MAX_SCORE) {
    const randomPlayerA = playersA[Math.floor(Math.random() * playersA.length)];
    const randomPlayerB = playersB[Math.floor(Math.random() * playersB.length)];

    const playerScoreA = calculateScore(randomPlayerA);
    const playerScoreB = calculateScore(randomPlayerB);

    const gameTime = `${Math.floor(Math.random() * 90) + 1}분`;

    // 선수 점수 비교
    if (playerScoreA > playerScoreB) {
      scoreA++;
      gameLog.push({
        gameTime,
        goalTeam: teamAName,
        goalPlayer: randomPlayerA.playerName,
      });
    } else if (playerScoreB > playerScoreA) {
      scoreB++;
      gameLog.push({
        gameTime,
        goalTeam: teamBName,
        goalPlayer: randomPlayerB.playerName,
      });
    } else {
      draws++;
      gameLog.push({
        gameTime,
        goalTeam: '무승부',
        goalPlayer: '양 팀 선수 모두가 막상막하네요.',
      });
    }
  }

  // 최종 승리 팀 결정
  const winner = scoreA === MAX_SCORE ? teamAName : scoreB === MAX_SCORE ? teamBName : null;

  // 게임 결과 반환 및 승패 카운트 업데이트
  if (winner) {
    if (scoreA === MAX_SCORE) {
      // A팀 승리, B팀 패배
      await updateTeamStats(teamAId, teamBId);
    } else {
      // B팀 승리, A팀 패배
      await updateTeamStats(teamBId, teamAId);
    }

    return {
      message: `${winner} 팀이 승리했습니다. 축하드립니다!`,
      result: `${teamAName} ${scoreA} - ${scoreB} ${teamBName}`,
      gameLog,
    };
  } else {
    return {
      message: `경기가 끝났습니다. 무승부입니다.`,
      result: `${teamAName} ${scoreA} - ${scoreB} ${teamBName}`,
      gameLog,
    };
  }
}

// 초기 데이터 삽입 호출
insertInitialData(1); // 기본 사용자 ID를 필요에 맞게 변경하세요.
