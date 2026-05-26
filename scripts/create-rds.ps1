# RDS PostgreSQL t4g.micro 생성 (1년 프리티어)
# 사전 조건: aws configure 로 hoban profile 설정 완료
#
# 실행: pwsh scripts/create-rds.ps1

$ErrorActionPreference = "Stop"

# ────────────── 설정 ──────────────
$PROFILE_NAME = "hoban"
$REGION       = "ap-northeast-2"
$DB_ID        = "hoban-erp-db"
$DB_NAME      = "hoban_erp"
$DB_USER      = "erpadmin"
$SG_NAME      = "hoban-erp-rds-sg"

# 비밀번호는 보안상 입력받음
$DB_PASS_SECURE = Read-Host -Prompt "RDS master password (16자 이상, 영문/숫자/특수문자)" -AsSecureString
$DB_PASS_PLAIN  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS_SECURE))

if ($DB_PASS_PLAIN.Length -lt 16) {
  Write-Host "[ERROR] 비밀번호는 최소 16자입니다." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "▶ 현재 IP 확인 (보안 그룹에 추가)..." -ForegroundColor Cyan
$MY_IP = (Invoke-RestMethod -Uri "https://api.ipify.org").Trim()
Write-Host "   내 IP: $MY_IP" -ForegroundColor Gray

Write-Host "▶ 기본 VPC 찾기..." -ForegroundColor Cyan
$VPC_ID = aws ec2 describe-vpcs --profile $PROFILE_NAME --region $REGION `
            --filters Name=isDefault,Values=true `
            --query 'Vpcs[0].VpcId' --output text
Write-Host "   VPC: $VPC_ID" -ForegroundColor Gray

Write-Host "▶ 보안 그룹 생성 ($SG_NAME)..." -ForegroundColor Cyan
$SG_ID = aws ec2 create-security-group --profile $PROFILE_NAME --region $REGION `
           --group-name $SG_NAME `
           --description "Hoban ERP RDS access" `
           --vpc-id $VPC_ID `
           --query 'GroupId' --output text 2>$null

if (-not $SG_ID) {
  Write-Host "   이미 존재 — 기존 SG ID 사용" -ForegroundColor Yellow
  $SG_ID = aws ec2 describe-security-groups --profile $PROFILE_NAME --region $REGION `
             --filters "Name=group-name,Values=$SG_NAME" `
             --query 'SecurityGroups[0].GroupId' --output text
}
Write-Host "   SG: $SG_ID" -ForegroundColor Gray

Write-Host "▶ 5432 포트 인바운드 규칙 추가..." -ForegroundColor Cyan
# 내 IP에서 접근 (마이그레이션/관리용)
aws ec2 authorize-security-group-ingress --profile $PROFILE_NAME --region $REGION `
  --group-id $SG_ID `
  --protocol tcp --port 5432 `
  --cidr "$MY_IP/32" 2>$null | Out-Null

# Amplify 빌드 서버는 동적 IP 라 0.0.0.0/0 필요 (간단한 접근)
# 운영 시엔 VPC 내부에서만 접근하도록 변경 권장
aws ec2 authorize-security-group-ingress --profile $PROFILE_NAME --region $REGION `
  --group-id $SG_ID `
  --protocol tcp --port 5432 `
  --cidr "0.0.0.0/0" 2>$null | Out-Null
Write-Host "   내 IP + 0.0.0.0/0 허용 (운영 후 좁힐 것)" -ForegroundColor Gray

Write-Host "▶ RDS 인스턴스 생성 (t4g.micro, gp2 20GB, 프리티어)..." -ForegroundColor Cyan
aws rds create-db-instance --profile $PROFILE_NAME --region $REGION `
  --db-instance-identifier $DB_ID `
  --db-instance-class db.t4g.micro `
  --engine postgres `
  --engine-version 17.4 `
  --master-username $DB_USER `
  --master-user-password $DB_PASS_PLAIN `
  --allocated-storage 20 `
  --storage-type gp2 `
  --vpc-security-group-ids $SG_ID `
  --db-name $DB_NAME `
  --publicly-accessible `
  --backup-retention-period 7 `
  --no-multi-az `
  --no-deletion-protection `
  --tags "Key=Project,Value=hoban-erp" | Out-Null

Write-Host "   인스턴스 생성 요청됨. 사용 가능까지 5~10분 소요..." -ForegroundColor Yellow
Write-Host ""
Write-Host "▶ 사용 가능 상태 대기..." -ForegroundColor Cyan
aws rds wait db-instance-available --profile $PROFILE_NAME --region $REGION `
  --db-instance-identifier $DB_ID

$ENDPOINT = aws rds describe-db-instances --profile $PROFILE_NAME --region $REGION `
              --db-instance-identifier $DB_ID `
              --query 'DBInstances[0].Endpoint.Address' --output text

Write-Host ""
Write-Host "✅ RDS 생성 완료!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Endpoint: $ENDPOINT" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  User:     $DB_USER" -ForegroundColor White
Write-Host ""
Write-Host "  DATABASE_URL=postgresql://${DB_USER}:<URL_ENCODED_PASS>@${ENDPOINT}:5432/${DB_NAME}?sslmode=require" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "  1. web/.env 의 DATABASE_URL 을 위 값으로 교체 (비밀번호 URL 인코딩)" -ForegroundColor Gray
Write-Host "  2. cd web && npx prisma db push" -ForegroundColor Gray
Write-Host "  3. npm run db:seed" -ForegroundColor Gray
Write-Host "  4. Amplify Console > Environment variables 에 동일하게 입력" -ForegroundColor Gray
