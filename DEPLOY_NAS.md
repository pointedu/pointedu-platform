# 포인트교육 관리자 플랫폼 - Synology NAS 배포 가이드

## 📋 사전 요구사항

1. **Synology NAS**에 **Container Manager** (Docker) 설치
2. NAS에 SSH 접근 가능
3. 최소 2GB RAM, 10GB 저장 공간

---

## 🚀 배포 방법

### 방법 1: SSH를 통한 Docker 배포 (권장)

#### 1단계: 프로젝트 파일을 NAS로 복사

```bash
# Windows에서 SCP로 파일 전송 (PowerShell)
scp -r C:\Users\Yuhj\pointedu-platform admin@172.30.1.50:/volume1/docker/
```

또는 **File Station**에서 `/docker/pointedu-platform` 폴더를 만들고 파일 업로드

#### 2단계: NAS SSH 접속

```bash
ssh admin@172.30.1.50
```

#### 3단계: 프로젝트 디렉토리로 이동

```bash
cd /volume1/docker/pointedu-platform
```

#### 4단계: 환경변수 파일 복사

```bash
cp .env.production .env
```

#### 5단계: Docker 이미지 빌드 및 실행

```bash
# 이미지 빌드
sudo docker-compose build

# 컨테이너 실행
sudo docker-compose up -d

# 로그 확인
sudo docker-compose logs -f pointedu-admin
```

---

### 방법 2: Container Manager UI를 통한 배포

#### 1단계: 프로젝트 준비
1. 로컬에서 Docker 이미지 빌드
```bash
cd C:\Users\Yuhj\pointedu-platform
docker build -t pointedu-admin:latest -f apps/admin/Dockerfile .
```

2. 이미지 저장
```bash
docker save pointedu-admin:latest -o pointedu-admin.tar
```

#### 2단계: NAS에 이미지 업로드
1. **Container Manager** → **이미지** → **추가** → **파일에서 추가**
2. `pointedu-admin.tar` 파일 선택

#### 3단계: 컨테이너 생성
1. **Container Manager** → **컨테이너** → **생성**
2. 이미지: `pointedu-admin:latest`
3. 포트 설정: `3001:3001`
4. 환경변수: `.env.production` 내용 입력

---

## 🔧 환경변수 설정

Container Manager에서 다음 환경변수를 설정하세요:

| 변수명 | 값 |
|--------|-----|
| NODE_ENV | production |
| DATABASE_URL | postgresql://postgres.efziyoruxobaafwvssdw:PointEdu2025!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true |
| DIRECT_URL | postgresql://postgres.efziyoruxobaafwvssdw:PointEdu2025!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres |
| NEXTAUTH_URL | http://172.30.1.50:3001 |
| NEXTAUTH_SECRET | pointedu-production-secret-2025-nas-deployment |
| NEXT_PUBLIC_SUPABASE_URL | https://efziyoruxobaafwvssdw.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | (위 .env.production 파일 참조) |
| SOLAPI_API_KEY | NCSOMIDY7TZGEECX |
| SOLAPI_API_SECRET | DVZBUPDBSYVZ1SC5D7E1JTUND56SD7SC |
| SOLAPI_SENDER_NUMBER | 010-9355-7864 |

---

## ✅ 배포 확인

1. 브라우저에서 접속: **http://172.30.1.50:3001**
2. 로그인 페이지가 표시되면 배포 성공

### 기본 관리자 계정
- 이메일: admin@pointedu.co.kr
- 비밀번호: PointEdu2024!

---

## 🔄 업데이트 방법

```bash
# NAS SSH 접속 후
cd /volume1/docker/pointedu-platform

# 최신 코드 반영 (git pull 또는 파일 복사)
git pull origin master

# 재빌드 및 재시작
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

---

## 🛠 문제 해결

### 컨테이너가 시작되지 않는 경우
```bash
# 로그 확인
sudo docker-compose logs pointedu-admin

# 컨테이너 상태 확인
sudo docker ps -a
```

### 포트 충돌
다른 서비스가 3001 포트를 사용 중이면 `docker-compose.yml`에서 포트 변경:
```yaml
ports:
  - "3002:3001"  # 외부 포트를 3002로 변경
```

### 데이터베이스 연결 실패
- NAS 방화벽에서 외부 연결 허용 확인
- Supabase 대시보드에서 IP 허용 목록 확인

---

## 📊 모니터링

### 컨테이너 상태 확인
```bash
sudo docker stats pointedu-admin
```

### 헬스체크 상태
```bash
sudo docker inspect --format='{{.State.Health.Status}}' pointedu-admin
```

---

## 🔐 보안 권장사항

1. **HTTPS 설정**: Synology Reverse Proxy를 사용하여 SSL 인증서 적용
2. **방화벽**: 필요한 포트만 개방 (3001)
3. **정기 백업**: Container Manager의 백업 기능 활용
4. **환경변수 보안**: `.env` 파일 권한을 600으로 설정

```bash
chmod 600 .env
```
