# 호반/삼성 판촉물 ERP

젬스톤 판촉물 발주·입고·재고·정산 관리 시스템.

## 스택

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Prisma 7 + PostgreSQL
- AWS Amplify Hosting + RDS PostgreSQL t4g.micro
- 비밀번호 단일 게이트 + JWT 세션 쿠키

## 로컬 개발

```bash
cd web
npm install

# 로컬 Postgres (Prisma dev 내장)
npx prisma dev --name hoban-erp

# 다른 터미널에서 .env에 DATABASE_URL 채우고
npm run db:push
npm run db:seed
npm run dev
```

http://localhost:3000 — 비밀번호 `hoban2026` (개발용 기본)

## 운영 배포

1. RDS 생성: `bash scripts/create-rds.sh` (또는 PowerShell 버전)
2. GitHub repo에 push
3. Amplify Console에서 GitHub 연결 → 빌드 트리거
4. Environment variables 입력: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`
5. 첫 배포 후 로컬에서 `DATABASE_URL`을 운영 RDS로 바꿔서 `npm run db:push` + `npm run db:seed`

## 폴더 구조

```
ERP_hoban_samsung/
├── web/                  # Next.js 앱
├── scripts/              # 배포 스크립트 (RDS 생성 등)
├── docs/                 # 분석 자료
├── amplify.yml           # Amplify 빌드 설정
└── .gitignore
```
