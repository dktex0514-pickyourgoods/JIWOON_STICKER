# 픽유어굿즈 주문제작 시스템 - 프로젝트 가이드

## 프로젝트 개요
- **사이트명**: 픽유어굿즈 (Pick Your Goods)
- **목적**: 고객이 굿즈(아크릴 등) 디자인을 직접 캔버스에서 편집하고 AI로 변환 요청하는 주문제작 시스템
- **구조**: 단일 HTML 파일 (`index.html`) + Google Apps Script 백엔드 (`google_apps_script.gs`)
- **배포**: Netlify — 사이트 ID `ca4932be-0210-464b-9db1-e1d0c74ec1a1` / URL: `pickyourgoods.netlify.app`
- **GitHub**: `https://github.com/dktex0514-pickyourgoods/pickyourgoods`

## 핵심 기술 스택
- **Fabric.js 5.3.1** — 캔버스 편집 엔진
- **Three.js r128** — 3D 미리보기
- **Google Apps Script (GAS)** — 백엔드 (Claude AI 연동, Remove.bg 연동)
- **GAS URL**: `https://script.google.com/macros/s/AKfycbwv6BIDiHwDeuq_mYDM0XVODXdtWrxGM8cye4Jlbh5JHTTm8CoQJm1eJ3wLsQm8YhrU/exec`

## 구현된 주요 기능

### 캔버스 편집
- 이미지 업로드, 이동, 크기 조정, 회전
- 텍스트 추가 (한국어 폰트 30종+)
- 앞으로/뒤로 순서 변경, 좌우/상하 뒤집기
- 선택 핸들: **검정색**, 크기 14px (`cornerSize: 14`)

### 크롭 (자르기)
- 포토샵 스타일 크롭 도구
- 어두운 오버레이 + 8개 핸들 + 3분할 그리드
- 이미지 선택 시에만 버튼 활성화

### 누끼따기 (배경 제거)
- Remove.bg API 사용 (GAS 프록시 경유)
- 캔버스에서 해당 이미지 영역만 캡처 → base64 → GAS → Remove.bg → 결과 이미지로 교체
- **핵심 구현 주의사항**:
  - 다른 오브젝트 숨기고 캡처 → 그 다음에 복원 (순서 중요)
  - 새 이미지 로드 **성공 확인 후** 기존 이미지 제거
  - 스케일 계산: `b.width / newImg.width` (bounding rect 기준)
- GAS 스크립트 속성에 `REMOVE_BG_API_KEY` 설정 필요

### 배경 채우기
- **스포이드**: 투명 오버레이 div로 Fabric.js 이벤트 충돌 해결
- **자동 채우기**: 이미지 4개 가장자리 픽셀 평균색 계산
- **배경 초기화**: 흰색으로 리셋

### AI 스타일 변환
- 스타일 카드 클릭 → 항상 작동 (이미지 선택 여부 무관)
- "이 사이트에서 바로 변환하기" 버튼 → 이미지 미선택 시 빨간 힌트 표시 후 차단

### 기타
- 재단선(블리드) 가이드라인
- 이미지 스냅샷 저장 (`snap()` 함수)
- `bringGuidesToFront()` — 가이드라인 항상 최상단 유지

## 규칙 (반드시 지킬 것)

1. **Netlify 배포는 반드시 유저 허락 받은 후 진행** — 절대 무단 배포 금지
2. 코드는 단일 파일(`index.html`)로 유지
3. GAS 백엔드 변경 시 재배포 필요 (GAS 에디터에서 직접)

## 로컬 개발 환경
- 로컬에서 직접 `index.html` 열면 CORS로 GAS 기능 안 됨
- GAS 연동 기능(AI 변환, 누끼따기) 테스트는 Netlify 배포 후 확인 필요
- 캔버스 편집, UI 등 GAS 불필요한 기능은 로컬에서 확인 가능

## 다른 기기에서 작업 시작하는 법
```bash
git clone https://github.com/dktex0514-pickyourgoods/pickyourgoods.git
# 또는 이미 클론되어 있다면:
git pull
```
그 다음 `index.html` 열거나 Claude Code 세션 시작하면 됩니다.

## 파일 구조
```
index.html              # 전체 앱 (HTML + CSS + JS 모두 포함)
google_apps_script.gs   # GAS 백엔드 코드 (참고용, 실제 배포는 GAS 에디터에서)
CLAUDE.md               # 이 파일
```
