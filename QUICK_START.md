# 🚀 SeeDream - Quick Start Guide

## 빠른 시작

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열고 API 키를 확인:
```env
ARK_API_KEY=cbc18d7d-7ea4-465e-80c5-ecf7ca78bc28
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 🎯 주요 기능

### 1. 프로젝트(채팅창) 생성
- 좌측 사이드바에서 "새 프로젝트" 버튼 클릭
- 프로젝트 이름 입력 (예: "제품 홍보 이미지")
- 프로젝트가 자동으로 선택됨

### 2. 이미지 생성
**기본 텍스트-이미지 생성:**
1. 프롬프트 입력 (예: "아름다운 산 위의 일몰")
2. 이미지 크기 선택 (2K 또는 4K)
3. 생성 수량 선택 (1-4장)
4. "이미지 생성" 버튼 클릭

**참고 이미지 사용 (Image-to-Image):**
1. 프롬프트 입력 (예: "이 스타일로 새로운 풍경 생성")
2. "참고 이미지 업로드" 영역에 이미지 드래그 또는 클릭하여 선택
3. 최대 3개 이미지 업로드 가능
4. 나머지 옵션 선택 후 생성

### 3. 프로젝트 관리
- **프로젝트 전환**: 사이드바에서 프로젝트 클릭
- **프로젝트 이름 변경**: 프로젝트 옆 "..." 메뉴 → "Rename"
- **프로젝트 삭제**: "..." 메뉴 → "Delete" (이미지도 함께 삭제됨)

### 4. 이미지 관리
- **다운로드**: 이미지 카드의 다운로드 버튼 클릭
- **삭제**: 이미지 카드의 삭제 버튼 클릭
- **프롬프트 확인**: 각 이미지 하단에 사용된 프롬프트 표시

## 💡 팁

### BytePlus/Higgsfield 대비 장점
1. **맥락 분리**: 여러 프로젝트로 이미지를 깔끔하게 정리
2. **빠른 전환**: 프로젝트 간 즉시 전환 가능
3. **체계적 관리**: 프로젝트별로 이미지가 완전히 격리됨

### 반응형 디자인
- **모바일**: 사이드바가 드로어로 변환 (좌상단 메뉴 버튼)
- **태블릿**: 2열 그리드로 이미지 표시
- **데스크톱**: 3-4열 그리드로 이미지 표시

### 파일 업로드 제한
- **파일 형식**: JPEG, PNG, WebP
- **최대 파일 크기**: 5MB per file
- **최대 파일 개수**: 3개

## 🐛 문제 해결

### 이미지가 생성되지 않음
1. `.env.local` 파일의 API 키 확인
2. 인터넷 연결 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 프로젝트가 보이지 않음
1. 브라우저 새로고침 (F5)
2. localStorage 확인 (개발자 도구 → Application → Local Storage)

### 스타일이 깨짐
```bash
rm -rf .next
npm run dev
```

## 📚 추가 문서
- [README.md](./README.md) - 전체 프로젝트 문서
- [API.md](./docs/API.md) - API 엔드포인트 문서
- [hooks/README.md](./docs/hooks/README.md) - React Query hooks 사용법

## 🎨 프로젝트 구조
```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API Routes (projects, generate, images)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── providers.tsx      # React Query provider
├── features/
│   ├── image-generation/  # 이미지 생성 기능
│   │   ├── components/    # GenerationForm, ImageCard, ImageGallery
│   │   ├── hooks/         # React Query hooks
│   │   ├── api/           # Seedream API client
│   │   └── types/         # TypeScript types
│   └── project-management/ # 프로젝트 관리 기능
│       ├── components/     # ProjectSidebar
│       └── types/          # Project types
├── components/ui/          # ShadCN UI components
├── lib/
│   └── stores/            # Zustand stores
└── public/generated-images/ # 생성된 이미지 저장 위치
    ├── projects.json      # 프로젝트 메타데이터
    └── projects/          # 프로젝트별 이미지 폴더
```

## 🔧 개발 명령어
```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
npm run lint       # ESLint 실행
npm run typecheck  # TypeScript 타입 체크
```

## ✅ 다음 단계
1. 프로젝트 생성해보기
2. 텍스트로 이미지 생성해보기
3. 참고 이미지 업로드해서 생성해보기
4. 여러 프로젝트 만들어서 관리해보기

즐거운 이미지 생성 되세요! 🎨
