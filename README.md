# Lua Bride Website v6

오픈 직전 배포형 패키지입니다.

## 주요 기능
- 반응형 웨딩드레스 홈페이지
- AI 드레스 추천 데모와 찜하기
- 피팅 예약, 중복 시간 방지, 예약 조회·취소 요청
- Firebase Firestore 온라인 저장 또는 로컬 데모 저장
- Firebase Authentication 기반 관리자 로그인
- 관리자 예약 검색, 상태 변경, 삭제, CSV 내보내기
- PWA, 개인정보처리방침, 예약 정책, SEO 기본 설정
- 이메일·Google Calendar·예약금 결제 서버 연동 골격
- GitHub Actions 검증과 로컬 스모크 테스트

## 실행
```bash
python -m http.server 8080
```
브라우저에서 `http://localhost:8080` 접속.

## 테스트
```bash
npm test
```

## 데모 관리자
Firebase가 설정되지 않은 로컬 데모에서만 비밀번호 `luabride`를 사용할 수 있습니다. 실제 배포에서는 Firebase Authentication을 설정하세요.

자세한 내용은 `docs/DEPLOYMENT.md`와 `docs/OPEN_CHECKLIST.md`를 확인하세요.

## v7 Firebase 적용
`firebase-config.js`에 Lua Bride Firebase 웹 앱 설정이 적용되어 있습니다.
Firebase Console에서 Authentication, Firestore, 보안 규칙을 활성화해야 실제 온라인 예약과 관리자 로그인이 작동합니다.
자세한 순서는 `docs/FIREBASE_SETUP.md`를 확인하세요.
