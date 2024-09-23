import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middleWares/auth.middleWare.js';

const router = express.Router();

/** 테스트용 선수 추가 API **/
router.post('/test', authMiddleware, async (req, res, next) => {
    try {
        const { playerId } = req.body;
        const { userId } = req.user;
        const isExistplayercode = await prisma.userPlayer.findFirst({
            where: {
                userId: userId,
                playerId,
            },
        });
        // 선수를 가지고 있다면 선수의 count를 증가시킵니다.
        if (isExistplayercode) {
            const count = await prisma.userPlayer.update({
                where: {
                    Id: isExistplayercode.Id,
                    playerId,
                },
                data: {
                    count: isExistplayercode.count + 1,
                },
            });
        } else {
            // 선수를 가지고 있지 않다면 userPlayer 테이블에 선수를 생성합니다.
            const player = await prisma.userPlayer.create({
                data: {
                    userId: +userId,
                    playerId: playerId,
                },
            });
        }

        return res.status(201).json({
            message: playerId + '이 팀에 추가되었습니다.'
        });
    } catch (err) {
        next(err);
    }
});

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
                // todo upgrade에 따른 스탯 상승 보여줘야함
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

    return res.status(200).json({ data: userPlayer });
});

/** 보유 선수 상세조회 API **/
router.get('/userPlayer/:playerId', authMiddleware, async (req, res, next) => {
    const { playerId } = req.params;
    const { userId } = req.user;
    const player = await prisma.userPlayer.findFirst({
        where: {
            playerId: +playerId, userId: +userId
        },
        select: {
            playerId: true,
            upgrade: true,
            teamId: true,
            player: {
                // 1:1 관계를 맺고있는 Player 테이블을 조회합니다.
                // todo upgrade에 따른 스탯 상승 보여줘야함
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
                // todo upgrade에 따른 스탯 상승 보여줘야함
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

    return res.status(200).json({ data: roster });
});

/** 로스터 변경 API **/
router.put('/roster', authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { roster } = req.body;
        let set = new Set(roster.split(","));
        let playerIds = [...set];

        if (playerIds.length != 3)
            return res.status(401).json({ message: "로스터는 중복되지 않는 3명을 지정해야합니다." });

        const result = await prisma.$transaction(async (tx) => {
            const teaminit = await tx.userPlayer.updateMany({
                where: { userId: +userId, teamId: 1 },
                data: {
                    teamId: null
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
                            teamId: 1
                        },
                    });
                } else {
                    throw new Error('로스터 변경 트랜잭션 실패');
                }
            }
        });

        return res.status(200).json({ message: "로스터를 수정했습니다." });

    } catch (err) {
        next(err);
    }
});

export default router;