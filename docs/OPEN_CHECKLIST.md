# Lua Bride 오픈 체크리스트

## 반드시 입력
- site-config.js: 주소, 전화번호, 카카오톡, 인스타그램, 지도 링크
- 실제 드레스 사진과 대체텍스트
- 개인정보처리방침의 사업자 정보와 보유기간
- 예약 및 취소 정책

## Firebase
- Firebase Authentication에서 관리자 계정 생성
- Firestore 보안 규칙 배포
- 승인된 관리자 이메일만 쓰기 권한 부여

## 알림·캘린더
- Vercel 환경변수에 RESEND_API_KEY, SHOP_EMAIL, FROM_EMAIL 입력
- Google Calendar OAuth 또는 서비스 계정 연결
- 예약 생성/변경/취소 시 서버 API 호출 테스트

## 배포
- 도메인 연결 및 HTTPS 확인
- sitemap.xml의 도메인 교체
- Google Search Console 등록
- 모바일 예약 전 과정 테스트
- 개인정보 동의·취소·중복 예약 테스트
