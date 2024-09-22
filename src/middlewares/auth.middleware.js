import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import jwtSecretKey from '../utils/jwtSecretKey.js';


export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies;
    if (!authorization) throw new Error('토큰이 존재하지 않습니다.');

    const [tokenType, token] = authorization.split(' ');

    if (tokenType !== 'Bearer')
      throw new Error('토큰 타입이 일치하지 않습니다.');
    console.log(jwtSecretKey());
    const decodedToken = jwt.verify(token, jwtSecretKey()); //검증
    const userId = decodedToken.userId;

    const user = await prisma.user.findFirst({
      where: { userId },
    });
    if (!user) {
      res.clearCookie('authorization');
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    // 사용자 정보 저장
    req.user = user;

    next();
  } catch (error) {
    res.clearCookie('authorization');
    // 토큰이 만료, 조작 시, 에러 메시지 출력
    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ message: '토큰이 만료되었습니다.' });
      case 'JsonWebTokenError':
        return res.status(401).json({ message: '토큰이 조작되었습니다.' });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? '비정상적인 요청입니다.' });
    }
  }
}

