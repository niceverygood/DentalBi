# DentalBI 프로젝트 명세서 (Antigravity용)

## 현재 상태
MVP 프로토타입이 완성된 상태입니다:
- `DentalBI.jsx`: 전체 대시보드 UI가 단일 React 파일에 구현됨 (데모 데이터 사용)
- `backend_main.py`: FastAPI 백엔드가 단일 파일에 구현됨 (실제 SQL 쿼리 포함)
- `init.sql`: PostgreSQL SaaS 메타데이터 스키마
- `docker-compose.yml`: 배포 설정
- `.env.example`: 환경변수 템플릿

## 다음 단계 작업 목록

### Phase 1: 프로젝트 구조 분리 (프론트엔드)
DentalBI.jsx를 Next.js 14 App Router 프로젝트로 분리:

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # 루트 레이아웃 (사이드바 + 탑바)
│   │   ├── page.tsx             # 대시보드 개요
│   │   ├── doctors/page.tsx     # 의사별 성과
│   │   ├── patients/page.tsx    # 환자 이탈관리
│   │   ├── newpatients/page.tsx # 신환 분석
│   │   ├── txmix/page.tsx       # TxMix
│   │   ├── revenue/page.tsx     # 수납 관리
│   │   ├── chair/page.tsx       # 체어 가동률
│   │   ├── insights/page.tsx    # AI 인사이트
│   │   └── settings/page.tsx    # DB 연동 설정
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── DoctorRankCard.tsx
│   │   ├── charts/
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── TxMixPieChart.tsx
│   │   │   ├── ChairHeatmap.tsx
│   │   │   └── CustomTooltip.tsx
│   │   └── ui/
│   │       ├── DataTable.tsx
│   │       ├── Badge.tsx
│   │       ├── UrgencyDot.tsx
│   │       └── SectionHeader.tsx
│   ├── hooks/
│   │   ├── useAPI.ts            # API 호출 훅
│   │   ├── useDateRange.ts     # 기간 선택 훅
│   │   └── useAuth.ts          # 인증 훅
│   ├── lib/
│   │   ├── api.ts              # axios 인스턴스 + API 함수들
│   │   ├── format.ts           # 숫자/통화 포맷팅
│   │   └── constants.ts        # 상수 정의
│   └── types/
│       └── index.ts            # TypeScript 타입 정의
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

### Phase 2: 백엔드 구조 분리
backend_main.py를 모듈화:

```
backend/
├── app/
│   ├── main.py                 # FastAPI 앱 생성 + 미들웨어
│   ├── config.py               # 환경변수 설정
│   ├── database.py             # MSSQL + PostgreSQL 연결 관리
│   ├── routers/
│   │   ├── dashboard.py        # /api/dashboard/*
│   │   ├── doctors.py          # /api/doctors/*
│   │   ├── patients.py         # /api/patients/*
│   │   ├── revenue.py          # /api/revenue/*
│   │   ├── insights.py         # /api/insights/*
│   │   └── connection.py       # /api/connection/*
│   ├── queries/
│   │   ├── base.py             # 기본 쿼리 클래스
│   │   ├── hanaro.py           # 하나로 3.0 전용 쿼리
│   │   ├── dentweb.py          # 덴트웹 전용 쿼리
│   │   └── oneclick.py         # 원클릭 전용 쿼리
│   ├── services/
│   │   ├── doctor_service.py   # 의사 성과 분석 비즈니스 로직
│   │   ├── patient_service.py  # 환자 이탈 분석
│   │   ├── revenue_service.py  # 수납 분석
│   │   └── ai_service.py       # Claude API 인사이트 생성
│   ├── models/
│   │   ├── schemas.py          # Pydantic 모델 (API request/response)
│   │   └── orm.py              # SQLAlchemy ORM 모델 (PostgreSQL)
│   └── utils/
│       ├── security.py         # PII 해시, 암호화
│       └── date_utils.py       # 날짜 변환 유틸
├── requirements.txt
├── Dockerfile
└── tests/
    ├── test_doctors.py
    └── test_patients.py
```

### Phase 3: 핵심 기능 구현
1. **실시간 API 연동**: 프론트 데모 데이터 → 백엔드 API fetch로 교체
2. **인증 시스템**: JWT 기반 로그인 (원장/스탭 권한 분리)
3. **데이터 동기화 스케줄러**: APScheduler로 매일 새벽 2시 자동 동기화
4. **카카오톡 알림 연동**: Lost Patient 리콜 메시지 자동 발송
5. **PDF 리포트 생성**: 주간/월간 AI 경영 리포트 PDF 자동 생성
6. **다중 전자차트 어댑터**: 하나로/덴트웹/원클릭 DB 스키마 차이 처리

### Phase 4: 프로덕션 배포
1. AWS ECS Fargate + RDS PostgreSQL + ElastiCache Redis
2. CloudFront CDN + Route53 도메인
3. SSL/TLS 인증서 (ACM)
4. CI/CD: GitHub Actions → ECR → ECS 자동 배포
5. 모니터링: CloudWatch + Sentry

## Antigravity에서 시작하기

1단계: 프로젝트 폴더 생성 후 이 파일들을 복사
2단계: Antigravity 에이전트에게 Phase 1부터 순서대로 요청
3단계: 각 Phase 완료 후 브라우저 에이전트로 UI 테스트

### 추천 첫 프롬프트:
"이 프로젝트의 DentalBI.jsx 파일을 Next.js 14 App Router 프로젝트로 분리해줘.
AGENTS.md의 컨벤션을 따르고, TypeScript + TailwindCSS를 사용해.
먼저 프로젝트 초기화(npx create-next-app)부터 시작하고,
컴포넌트를 하나씩 분리하면서 데모 데이터로 동작 확인해줘."
