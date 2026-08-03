// 예제: Firebase Functions에서 Google Calendar 이벤트를 생성하는 자리입니다.
// 실제 사용 시 googleapis 패키지, OAuth2 또는 서비스 계정 위임 설정, 환경변수가 필요합니다.
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
exports.onReservationConfirmed = functions.firestore.document('reservations/{id}').onUpdate(async (change, context) => {
  const before=change.before.data(), after=change.after.data();
  if(before.status==='확정' || after.status!=='확정') return null;
  console.log('Create Google Calendar event for', context.params.id, after.date, after.time);
  // TODO: Google Calendar API events.insert 호출
  return null;
});
