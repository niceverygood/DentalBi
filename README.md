# DentalBI — 치과 AI 경영 대시보드

> 전자차트 DB 연동 → AI 실시간 경영분석 B2B SaaS

## Antigravity에서 개발 시작하기

### 1단계: 프로젝트 폴더 준비

```bash
# 작업 폴더 생성
mkdir dentalbi && cd dentalbi

# 다운로드 받은 파일들을 아래 구조로 배치
# dentalbi/
# ├── DentalBI.jsx          ← 프론트엔드 프로토타입
# ├── backend_main.py       ← 백엔드 API
# ├── docker-compose.yml    ← Docker 배포
# ├── init.sql              ← DB 스키마
# ├── .env.example          ← 환경변수
# ├── AGENTS.md             ← AG 에이전트 규칙 (필수!)
# ├── PROJECT_SPEC.md       ← 프로젝트 명세서
# └── README.md             ← 이 파일
```

### 2단계: Antigravity에서 프로젝트 열기

1. Antigravity 실행
2. `File → Open Folder` → `dentalbi` 폴더 선택
3. AG가 자동으로 `AGENTS.md`를 인식하여 프로젝트 컨텍스트를 파악합니다

### 3단계: 에이전트에게 작업 지시

**Manager Surface** (Cmd+I / Ctrl+I)를 열고 아래 프롬프트를 순서대로 실행합니다.

---

#### 작업 1: Next.js 프로젝트 초기화

```
frontend 폴더에 Next.js 14 프로젝트를 생성해줘.
- TypeScript strict mode
- TailwindCSS
- App Router 사용
- src/ 디렉토리 사용
- Pretendard 폰트 설정

그리고 recharts, lucide-react, axios를 설치해줘.
```

#### 작업 2: 프로토타입 컴포넌트 분리

```
DentalBI.jsx 파일을 분석해서 Next.js 프로젝트로 분리해줘.
PROJECT_SPEC.md의 "Phase 1: 프로젝트 구조 분리"에 있는
폴더 구조를 따라서 컴포넌트를 하나씩 분리해.

먼저 layout 컴포넌트(Sidebar, TopBar)부터 시작하고,
그 다음 공통 UI 컴포넌트(KPICard, DataTable, Badge 등),
마지막으로 각 페이지를 분리해줘.

데모 데이터는 그대로 유지하되, 나중에 API로 교체할 수 있도록
hooks/useAPI.ts에 데이터 fetching 로직을 분리해줘.
```

#### 작업 3: 백엔드 모듈화

```
backend_main.py를 PROJECT_SPEC.md의 "Phase 2: 백엔드 구조 분리"에
따라 모듈화해줘.

핵심:
- FastAPI Router로 엔드포인트 분리
- 전자차트 종류별 쿼리 어댑터 패턴 구현 (hanaro.py, dentweb.py)
- Pydantic 모델로 request/response 타입 정의
- requirements.txt 생성
- Dockerfile 작성
```

#### 작업 4: 프론트-백엔드 연동

```
프론트엔드의 데모 데이터를 백엔드 API 호출로 교체해줘.
- lib/api.ts에 axios 인스턴스 생성 (baseURL: process.env.NEXT_PUBLIC_API_URL)
- hooks/useAPI.ts에 SWR 또는 React Query로 데이터 fetching
- 로딩 상태와 에러 처리 UI 추가
- DB 미연결 시 데모 데이터 fallback 유지
```

#### 작업 5: 인증 시스템

```
JWT 기반 로그인 시스템을 추가해줘.
- 백엔드: /api/auth/login, /api/auth/register, /api/auth/me
- 프론트: /login 페이지, 미인증 시 리다이렉트
- 역할: owner(원장), admin(관리자), viewer(스탭)
- 비밀번호 해싱: bcrypt
- JWT 토큰: httpOnly 쿠키 + refresh token
```

#### 작업 6 (선택): 카카오 알림톡 연동

```
Lost Patient 리콜 시 카카오 알림톡을 발송하는 기능을 추가해줘.
- 카카오 비즈메시지 API 연동
- 환자 이탈관리 페이지에서 "리콜 발송" 버튼 클릭 시 발송
- 발송 이력을 patient_risk_scores 테이블에 기록
- 발송 템플릿: "OO치과입니다. 진료가 완료되지 않은 항목이 있습니다..."
```

---

### 4단계: 브라우저 에이전트로 테스트

AG의 브라우저 에이전트가 자동으로 `localhost:3000`을 열어서 UI를 확인합니다.
각 페이지를 돌아다니며 차트 렌더링, 데이터 표시, 반응형 동작을 검증합니다.

### 5단계: 실제 치과 DB 연결 테스트

```bash
# .env 파일 생성
cp .env.example .env
# MSSQL 접속 정보 입력

# Docker로 전체 스택 실행
docker-compose up -d

# 브라우저에서 확인
open http://localhost:3000
```

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Recharts |
| Backend | Python FastAPI, pymssql, SQLAlchemy |
| Database | PostgreSQL, Redis, MSSQL (읽기전용) |
| AI | Claude API (Anthropic) |
| 배포 | Docker Compose → AWS ECS Fargate |

## 라이선스

Confidential — 주식회사 바틀 (Bottle Inc.)
