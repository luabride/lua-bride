window.LUA_INTEGRATIONS = {
  mode: 'demo', // demo | production
  notificationEndpoint: '/api/notify-reservation',
  calendarEndpoint: '/api/create-calendar-event',
  payment: {
    enabled: false,
    provider: 'toss',
    depositAmount: 50000,
    checkoutUrl: ''
  },
  admin: {
    useFirebaseAuth: false,
    allowedEmails: []
  }
};
