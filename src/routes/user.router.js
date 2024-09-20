import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleWares/auth.middleWare.js';

const router = express.Router();

// 랜덤 이름 생성 함수
function generateRandomName() {
    const adjectives = ['상큼한', '달콤한', '시원한', '기분좋은', '매혹적인', '차가운'];
    const nouns = ['레몬', '쿠키', '딸기', '바닐라', '초코', '잼', '사과'];

    // 랜덤하게 선택
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    // 조합하여 반환
    return `${randomAdjective}${randomNoun}`;
}

// -- 회원가입 API -- //
router.post('/sign-up', async (req, res, next) => {
    const { email, password } = req.body;

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
    }

    // 비밀번호 길이 제한
    if (password.length > 7) {
        return res.status(400).json({ message: '비밀번호는 7자 까지만 입력 가능합니다.' });
    }

    // 이메일 검사
    const isExistAccount = await prisma.account.findFirst({
        where: {
            email,
        },
    });

    if (isExistAccount) {
        return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // password 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 랜덤 이름 생성
    const randomName = generateRandomName();

    // account 생성
    const account = await prisma.account.create({
        data: {
            email,
            password: hashedPassword,
        },
    });

    // user 생성
    const user = await prisma.user.create({
        data: {
            accountId: account.accountId,
            name: randomName,
            cash: 1000,
        }
    })

    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
});


// -- 로그인 API -- //
router.post('/sign-in', async (req, res, next) => {
    const { email, password } = req.body;
    const account = await prisma.account.findFirst({ where: { email } });

    // 이메일 검사
    if (!account) {
        return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
    }

    // 비밀번호 검사
    else if (!(await bcrypt.compare(password, account.password))) {
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 로그인 성공 시 토큰 생성
    const user = await prisma.user.findFirst({
        where: {
            accountId: account.accountId
        },
    });
    // 로그인 성공 시 토큰 생성
    const token = jwt.sign(
        {
            userId: user.userId,
        },
        'custom-secret-key'
    );

    // authotization JWT 저장
    res.cookie('authorization', `Bearer ${token}`);
    return res.status(200).json({ message: '로그인 되었습니다 !' });
});


// -- 내 정보 조회 API -- //
router.get('/user', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;

    const user = await prisma.user.findFirst({
        where: { userId: +userId },
        select: {
            name: true,
            cash: true,
            guarantee: true,
            userScore: true,

            score: {
                select: {
                    win: true,
                    lose: true,
                    draw: true,
                }
            },

        },
    });

    return res.status(200).json({ data: user });
});

export default router;