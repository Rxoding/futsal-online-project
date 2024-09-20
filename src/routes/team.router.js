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
        }
        // TeamPlayer 테이블에 아이템을 추가합니다.
        const player = await prisma.userPlayer.create({
            data: {
                userId: +userId,
                playerId: playerId,
            },
        });

        return res.status(201).json({
            playerId: player.playerId,
            message: player.playerId + '이 팀에 추가되었습니다.'
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
router.get('/userPlayer/:playerId', async (req, res, next) => {
    const { playerId } = req.params;
    const playerid = await prisma.userPlayer.findFirst({
        where: {
            playerId: +playerId,
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

    return res.status(200).json({ data: playerid });
});
/** 로스터 조회 API **/
// todo 3명인지 체크
// todo 중복된 playerId 체크    
router.get('/userPlayer/roster', authMiddleware, async (req, res, next) => {
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
// todo 3명인지 체크
// todo 중복된 playerId 체크
router.put('/userPlayer/roster', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;

    const user = await prisma.userPlayer.findMany({
        where: { userId: +userId, isTeam: true },
        select: {
            playerId: true,
            upgrade: true,
            player: {
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

    return res.status(200).json({ data: user });
});

export default router;