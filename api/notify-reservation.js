// Vercel Serverless Function example.
// Configure RESEND_API_KEY, SHOP_EMAIL and FROM_EMAIL in deployment settings.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { reservation } = req.body || {};
  if (!reservation?.id || !reservation?.name || !reservation?.phone) return res.status(400).json({ error: 'Invalid reservation' });
  if (!process.env.RESEND_API_KEY || !process.env.SHOP_EMAIL || !process.env.FROM_EMAIL) {
    return res.status(200).json({ demo: true, message: 'Notification environment variables are not configured.' });
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [process.env.SHOP_EMAIL],
      subject: `[Lua Bride] 새 피팅 예약 ${reservation.id}`,
      html: `<h2>새 피팅 예약</h2><p>${reservation.name} / ${reservation.phone}</p><p>${reservation.date} ${reservation.time}</p><p>${reservation.purpose}</p>`
    })
  });
  const data = await response.json();
  return res.status(response.ok ? 200 : 500).json(data);
}
