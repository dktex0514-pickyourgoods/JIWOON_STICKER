# 픽유어굿즈 임지운 스티커 - 프로젝트 가이드

## 프로젝트 개요
- **사이트명**: 픽유어굿즈 (Pick Your Goods) — 임지운 스티커 버전
- **목적**: 고객이 직접 스티커 디자인을 캔버스에서 편집하고 PNG로 다운로드하는 디자인 툴
- **구조**: 단일 HTML 파일 (`index.html`) — 백엔드 없음, 완전 클라이언트 사이드
- **배포**: Netlify — 사이트 ID `e0cffbfc-1e10-477e-ba6c-13439f6a1b2c` / URL: `https://pickyourgoods-sticker-jiwoon.netlify.app`
- **GitHub**: `https://github.com/dktex0514-pickyourgoods/JIWOON_STICKER`
- **GitHub 연동 없음** — Netlify 사이트는 GitHub repo와 연결되어 있지 않음. `git push` 로는 배포되지 않고, ZIP 업로드(`POST /api/v1/sites/{id}/deploys`, Content-Type: application/zip)로 수동 배포해야 함.

## 핵심 기술 스택
- **Fabric.js 5.3.1** — 캔버스 편집 엔진

## 구현된 주요 기능

### 캔버스 편집
- 이미지 업로드 (JPG/PNG, 최대 10MB, 최소 500px)
- 이동, 크기 조정, 회전, 좌우/상하 뒤집기
- 텍스트 추가 (한국어 폰트 30종+)
- 앞으로/뒤로 순서 변경, 삭제
- Undo/Redo
- 선택 핸들: **검정색**, 크기 14px (`cornerSize: 14`)

### 크롭 (자르기)
- 포토샵 스타일 크롭 도구
- 어두운 오버레이 + 8개 핸들 + 3분할 그리드
- 이미지 선택 시에만 버튼 활성화

### 다운로드
- 우측 사이드바 하단 **다운로드** 버튼 (`#btn-download`)
- 각 셀(sticker cell)을 PNG로 개별 저장 (multiplier: 2 = 고해상도)
- 파일명: `sticker-{ISO타임스탬프}[-인덱스].png`
- 가이드라인(블리드)은 다운로드 시 자동으로 숨김 처리

### 기타
- 재단선(블리드) 가이드라인 · `bringGuidesToFront()` 최상단 유지
- 멀티 셀 그리드 (최대 10매) + 셀별 수량 선택
- 배경 스포이드 / 자동 채우기 / 초기화
- localStorage 자동 저장 (15초 주기, 24시간 보존)
- 이미지 스냅샷(`snap()`) 기반 undo 스택

## 규칙 (반드시 지킬 것)

1. **Netlify 배포는 반드시 유저 허락 받은 후 진행** — 절대 무단 배포 금지
2. 코드는 단일 파일(`index.html`)로 유지 — 백엔드 없음
3. AI 변환 / 누끼따기 / 이메일 / Google Drive / 아임웹·카페24 연동 등 **모든 서버 기능 제거됨** — 되살리지 말 것

## 로컬 개발 환경
- 로컬에서 직접 `index.html` 열어 바로 확인 가능 (서버 의존성 없음)

## 파일 구조
```
index.html    # 전체 앱 (HTML + CSS + JS 모두 포함)
CLAUDE.md    # 이 파일
```
