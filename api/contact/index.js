module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { firstName, lastName, email, phone, plan, trade, message } = req.body;

    if (!firstName || !lastName || !email || !plan || !trade) {
        return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not set');
        return res.status(500).json({ error: 'Email service is not configured' });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'TavaTrack Contact Form <onboarding@resend.dev>',
                to: 'tavatrack@gmail.com',
                reply_to: email,
                subject: `New Lead: ${firstName} ${lastName} — ${plan}`,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    <p><strong>Plan Interested In:</strong> ${plan}</p>
                    <p><strong>Trade:</strong> ${trade}</p>
                    ${message ? `<p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>` : ''}
                    <hr>
                    <p><small>Submitted via TavaTrack website contact form</small></p>
                `,
                text: `New Lead: ${firstName} ${lastName}\n\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nPlan: ${plan}\nTrade: ${trade}\n${message ? '\nMessage:\n' + message : ''}`
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Resend API error:', err);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
};
