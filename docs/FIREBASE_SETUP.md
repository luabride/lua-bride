# Lua Bride Firebase 연결 순서

## 1. Authentication 켜기
Firebase Console → Build → Authentication → 시작하기 → Sign-in method → 이메일/비밀번호 → 사용 설정 → 저장

## 2. 관리자 계정 만들기
Authentication → Users → 사용자 추가

예시 이메일: admin@luabride.com
비밀번호는 12자 이상으로 직접 정하고 외부에 공유하지 마세요.

## 3. Firestore Database 만들기
Firebase Console → Build → Firestore Database → 데이터베이스 만들기

- 위치: asia-northeast3 (서울) 권장
- 보안 규칙: 프로덕션 모드 권장

## 4. 보안 규칙 적용
Firestore Database → 규칙 탭에서 `firebase/firestore.rules` 내용을 붙여넣고 게시합니다.

## 5. GitHub 업로드
이 패키지의 파일을 GitHub `lua-bride` 저장소 루트에 덮어쓰고 Commit changes를 누릅니다.
Vercel이 자동으로 다시 배포합니다.

## 6. 확인
- 홈페이지에서 테스트 예약 1건 등록
- `/admin.html`에서 관리자 이메일과 비밀번호로 로그인
- 예약이 관리자 목록에 보이는지 확인
