# Deployment Guide

TuneBoard는 프런트(Vite SPA)와 백엔드(FastAPI + ytmusicapi)가 분리되어 있습니다. 두 서비스를 각각 배포하고 CORS로 연결합니다.

## 1. Frontend — Vercel

1. GitHub 저장소를 Vercel 프로젝트로 import.
2. 프레임워크는 자동 감지(Vite) — build command `npm run build`, output `dist`.
3. `vercel.json` 의 rewrite 규칙이 SPA 라우팅을 처리하므로 추가 설정 불필요.
4. Environment Variable:
   - `VITE_API_BASE` (선택) — 백엔드 퍼블릭 URL. 비우면 동일 오리진(`/api`)을 호출.
5. 배포 후 생성된 도메인을 백엔드 CORS 화이트리스트에 추가.

## 2. Backend — Railway / Render

공통 작업:

1. `backend/` 디렉터리를 리포 루트로 사용하거나, monorepo 옵션을 켠다.
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. 필수 환경변수:
   - `TUNEBOARD_CORS_ORIGINS` — `https://your-app.vercel.app,https://preview-*.vercel.app`
4. 선택 환경변수:
   - `TUNEBOARD_YTMUSIC_HEADERS_PATH` — 인증이 필요한 엔드포인트(홈 피드 등)용 ytmusicapi headers 파일 경로.

### Railway

- New Project → GitHub 연동 → `backend/` 하위로 루트 설정.
- `requirements.txt`가 자동 감지됩니다.
- Variables 탭에서 위 환경변수 추가.

### Render

- New → Web Service → Runtime: Python 3.11+.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 3. CORS 확인

프런트 도메인에서 `/api/health`를 호출했을 때 200이 돌아오면 정상:

```bash
curl https://your-backend.up.railway.app/api/health
```

브라우저 콘솔에 `CORS error` 가 뜨면 `TUNEBOARD_CORS_ORIGINS`에 프런트 도메인(프로토콜 포함)이 정확히 있는지, 마지막에 슬래시가 붙지 않았는지 확인하세요.

## 4. PWA 배포 체크리스트

- `manifest.webmanifest`, `sw.js`, `icon.svg`는 `public/`에서 그대로 배포됩니다.
- Vercel은 기본적으로 서비스 워커의 `Service-Worker-Allowed` 헤더를 주지 않아도 루트 범위로 동작.
- 배포 후 DevTools → Application → Manifest & Service Workers 탭에서 등록 상태 확인.
- 새 버전 배포 시 `CACHE_VERSION` 문자열을 `sw.js`에서 올려야 이전 캐시가 무효화됩니다.

## 5. 운영 팁

- Lighthouse(Mobile) 90+ 유지 목표. 리그레션이 생기면 대개 이미지 로딩 또는 폰트 preload 문제.
- ytmusicapi는 비공식이라 갑작스러운 응답 스키마 변경 위험이 있음 — `backend/app/`에서 Pydantic validation error가 터지면 제일 먼저 의심.
