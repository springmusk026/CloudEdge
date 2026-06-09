// Email Sender Queue Consumer — sends transactional and newsletter emails
// Uses Resend API (MailChannels EOL Aug 2024)
// Ref: https://resend.com/docs/api-reference/emails/send-email

interface Env {
  RESEND_API_KEY: string;
  SITE_URL: string;
  DB: D1Database;
  SESSIONS: KVNamespace;
}

interface EmailJob {
  type: 'email_send';
  payload: { to: string; template: string; data: Record<string, any> };
}

const TEMPLATES: Record<string, (data: any, siteUrl: string) => { subject: string; html: string }> = {
  'magic-link': (data, siteUrl) => ({
    subject: 'Your login link for CloudEdge',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>Welcome back, ${data.name || 'there'}!</h2>
      <p>Click the link below to sign in:</p>
      <a href="${data.url}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Sign In</a>
      <p style="color:#666;margin-top:16px">This link expires in 15 minutes.</p>
    </div>`,
  }),
  'confirm-subscription': (data, siteUrl) => ({
    subject: 'Confirm your subscription to CloudEdge',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>Confirm your subscription</h2>
      <p>Hi ${data.name || 'there'}, please confirm your email to receive our newsletter:</p>
      <a href="${data.url}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Confirm Subscription</a>
    </div>`,
  }),
  'newsletter': (data, siteUrl) => ({
    subject: data.subject || 'CloudEdge Newsletter',
    html: data.contentHtml || '<p>Newsletter content</p>',
  }),
  'comment-reply': (data, siteUrl) => ({
    subject: `New reply to your comment on "${data.postTitle}"`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>New reply to your comment</h2>
      <p>${data.replierName} replied to your comment on "${data.postTitle}":</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:16px 0">${data.replyBody}</blockquote>
      <a href="${siteUrl}/${data.postSlug}#comment-${data.commentId}">View reply</a>
    </div>`,
  }),
};

export default {
  async queue(batch: MessageBatch<EmailJob>, env: Env) {
    for (const msg of batch.messages) {
      const { to, template, data } = msg.body.payload;

      try {
        const tmpl = TEMPLATES[template];
        if (!tmpl) { console.error(`Unknown template: ${template}`); msg.ack(); continue; }

        const { subject, html } = tmpl(data, env.SITE_URL);

        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'CloudEdge <noreply@yourdomain.com>', to: [to], subject, html }),
        });

        if (!resp.ok) {
          const err = await resp.text();
          console.error(`Resend API error: ${resp.status} ${err}`);
          if (resp.status >= 500) { msg.retry({ delaySeconds: 60 }); continue; }
        }

        // Record send for newsletter tracking
        if (template === 'newsletter' && data.campaignId && data.subscriberId) {
          await env.DB.prepare('INSERT OR IGNORE INTO newsletter_sends (newsletter_id, subscriber_id, sent_at) VALUES (?, ?, ?)')
            .bind(data.campaignId, data.subscriberId, new Date().toISOString()).run();
        }

        msg.ack();
      } catch (e) {
        console.error(`Email send failed:`, e);
        msg.retry({ delaySeconds: 30 });
      }
    }
  },
};
