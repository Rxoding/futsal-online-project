import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth/auth.middleware.js';
import jwtSecretKey from '../utils/jwtSecretKey.js';
import { Prisma } from '@prisma/client';
import {
  signUpValidator,
  signInValidator,
  cashValidator,
} from '../middlewares/validators/user.validator.middleware.js';

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
router.post('/sign-up', signUpValidator, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const isExistAccount = await prisma.account.findFirst({
      where: {
        email,
      },
    });
    const isExistName = await prisma.user.findFirst({
      where: {
        name,
      },
    });

    if (isExistAccount) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    if (isExistName) {
      return res.status(409).json({ message: '이미 존재하는 이름입니다.' });
    }

    // password 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 이름이 제공되지 않으면 랜덤이름 사용
    const useName = name || generateRandomName();

    // 트랜잭션 사용
    const [account, user] = await prisma.$transaction(
      async (tx) => {
        // account 생성
        const account = await tx.account.create({
          data: {
            email,
            password: hashedPassword,
          },
        });
        // user 생성
        const user = await tx.user.create({
          data: {
            accountId: account.accountId,
            name: useName,
            cash: 10000,
            userScore: 1000,
          },
        });
        return [account, user];
      },
      {
        //트랜잭션 격리수준 설정
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// -- 로그인 API -- //
router.post('/sign-in', signInValidator, async (req, res, next) => {
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

  const user = await prisma.user.findFirst({
    where: { accountId: account.accountId },
  });
  // 로그인 성공 시 토큰 생성
  const token = jwt.sign(
    {
      userId: user.userId,
    },
    jwtSecretKey(),
    console.log(process.env.SESSION_SECRET_KEY),
  );

  // authotization JWT 저장
  res.cookie('authorization', `Bearer ${token}`);
  return res.status(200).json({ message: '로그인 되었습니다 !' });
});

// -- 유저 정보 조회 API -- //
router.get('/user', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.user.findFirst({
    where: { userId: +userId },
    select: {
      name: true,
      userScore: true,
      cash: true,

      score: {
        select: {
          win: true,
          lose: true,
          draw: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});

// 유저 이름 변경 API
router.patch('/user', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name } = req.body;

    const isExistName = await prisma.user.findFirst({
      where: { name: name },
    });

    if (isExistName) {
      return res.status(404).json({ error: '중복되는 닉네임입니다.' });
    }

    const updatedUserName = await prisma.user.update({
      where: { userId: +userId },
      data: { name: name },
    });

    return res.status(200).json({ message: '닉네임을 성공적으로 변경하였습니다.' });
  } catch (err) {
    next(err);
  }
});

// 캐시충전 API
router.put('/user/chargeCash', authMiddleware, cashValidator, async (req, res, next) => {
  const { userId } = req.user;
  const { cash } = req.body;

  // 이메일 검사
  if (!cash) {
    return res.status(401).json({ message: '충전할 캐시를 입력해 주세요' });
  }

  if (cash < 0) {
    return res.status(400).json({ message: '0 이상의 숫자를 입력해 주세요' });
  }

  try {
    const chargeCash = await prisma.user.update({
      where: { userId: +userId },
      data: {
        cash: {
          increment: cash,
        },
      },
    });
    return res.status(200).json(`${cash}원을 충전하였습니다. 캐시 총액: ${chargeCash.cash}`);
  } catch (err) {
    next(err);
  }
});

export default router;
