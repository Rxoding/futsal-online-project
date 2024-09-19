import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  // Prisma로 DB 접근 시 SQL을 출력
  log: ['query', 'info', 'warn', 'error'],

  // 에러 메시지 출력
  errorFormat: 'pretty',
}); // PrismaClient 인스턴스 생성