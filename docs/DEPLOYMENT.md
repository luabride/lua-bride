# Lua Bride v6 배포 순서

1. Firebase 프로젝트 생성 후 Authentication에서 이메일/비밀번호 로그인을 활성화합니다.
2. 관리자 계정을 Firebase Authentication에 생성합니다.
3. Firestore 데이터베이스를 만들고 `firebase/firestore.rules`를 배포합니다.
4. `firebase-config.js`에 Firebase 웹 앱 설정을 입력합니다. 이 값은 공개 클라이언트 설정이며 서버 비밀키가 아닙니다.
5. Vercel 또는 Netlify에 폴더를 배포합니다.
6. 이메일, Google Calendar, 결제 비밀키는 배포 서비스의 환경 변수에만 저장합니다. `.env.example`을 참고합니다.
7. 실제 도메인을 연결한 뒤 `sitemap.xml`, `robots.txt`, 사이트 주소를 수정합니다.
8. `npm test`로 필수 파일과 JavaScript 문법을 확인합니다.

## 운영 전 필수 확인
- 데모 비밀번호 로그인은 Firebase가 설정되지 않았을 때만 작동합니다.
- 관리자 페이지는 Firebase Auth 로그인 사용자만 Firestore 예약을 읽고 수정할 수 있습니다.
- 공개 예약 생성은 허용하지만 필드 검증을 적용했습니다. 운영 규모가 커지면 App Check, CAPTCHA와 서버 검증을 추가하세요.
