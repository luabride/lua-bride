// Google Calendar server-side connection placeholder.
// Never expose OAuth client secrets in browser JavaScript.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ demo: true, message: 'Connect Google Calendar OAuth or a service account on the server.' });
}
