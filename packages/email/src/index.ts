// Email Templates — Responsive HTML email templates
// Note: MJML does not run in Workers (requires Node.js DOM APIs).
// Using hand-coded responsive HTML with inline styles for maximum compatibility.
// Ref: https://resend.com/docs/api-reference/emails/send-email

export interface TemplateData {
  name?: string;
  url?: string;
  token?: string;
  subject?: string;
  contentHtml?: string;
  postTitle?: string;
  postSlug?: string;
  replierName?: string;
  replyBody?: string;
  commentId?: string;
  campaignId?: string;
  subscriberId?: string;
  siteUrl?: string;
  unsubscribeUrl?: string;
}

const STYLES = {
  wrapper: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;',
  heading: 'font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #000;',
  text: 'font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 16px;',
  button: 'display: inline-block; padding: 14px 28px; background: #0070f3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;',
  footer: 'margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;',
  muted: 'font-size: 14px; color: #666;',
};

function layout(content: string, siteUrl = 'https://yourdomain.com', unsubscribeUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"></head>
<body style="margin:0;padding:0;background:#f9fafb;">
<div style="${STYLES.wrapper}">
  ${content}
  <div style="${STYLES.footer}">
    <p>Sent by <a href="${siteUrl}" style="color:#0070f3;">CloudEdge Blog</a></p>
    ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe</a></p>` : ''}
  </div>
</div>
</body></html>`;
}

export const templates = {
  'magic-link': (data: TemplateData): { subject: string; html: string } => ({
    subject: 'Your login link — CloudEdge',
    html: layout(`
      <h1 style="${STYLES.heading}">Sign in to CloudEdge</h1>
      <p style="${STYLES.text}">Hi ${data.name || 'there'},</p>
      <p style="${STYLES.text}">Click the button below to sign in to your account. This link expires in 15 minutes.</p>
      <p style="text-align:center;margin:32px 0;"><a href="${data.url}" style="${STYLES.button}">Sign In →</a></p>
      <p style="${STYLES.muted}">If you didn't request this, you can safely ignore this email.</p>
    `, data.siteUrl),
  }),

  'confirm-subscription': (data: TemplateData): { subject: string; html: string } => ({
    subject: 'Confirm your subscription — CloudEdge',
    html: layout(`
      <h1 style="${STYLES.heading}">Almost there! 🎉</h1>
      <p style="${STYLES.text}">Hi ${data.name || 'there'},</p>
      <p style="${STYLES.text}">Please confirm your email address to start receiving our newsletter.</p>
      <p style="text-align:center;margin:32px 0;"><a href="${data.url}" style="${STYLES.button}">Confirm Subscription</a></p>
      <p style="${STYLES.muted}">If you didn't subscribe, just ignore this email.</p>
    `, data.siteUrl),
  }),

  'newsletter': (data: TemplateData): { subject: string; html: string } => ({
    subject: data.subject || 'CloudEdge Newsletter',
    html: layout(`
      <div style="font-size:16px;line-height:1.7;color:#333;">
        ${data.contentHtml || ''}
      </div>
    `, data.siteUrl, data.unsubscribeUrl),
  }),

  'comment-reply': (data: TemplateData): { subject: string; html: string } => ({
    subject: `New reply to your comment on "${data.postTitle}"`,
    html: layout(`
      <h1 style="${STYLES.heading}">New reply to your comment</h1>
      <p style="${STYLES.text}">${data.replierName || 'Someone'} replied to your comment on <strong>"${data.postTitle}"</strong>:</p>
      <blockquote style="border-left:3px solid #0070f3;padding:12px 16px;margin:24px 0;background:#f5f5f5;border-radius:4px;">
        ${data.replyBody || ''}
      </blockquote>
      <p style="text-align:center;margin:32px 0;">
        <a href="${data.siteUrl}/${data.postSlug}#comment-${data.commentId}" style="${STYLES.button}">View Reply</a>
      </p>
    `, data.siteUrl),
  }),

  'welcome': (data: TemplateData): { subject: string; html: string } => ({
    subject: 'Welcome to CloudEdge! 🚀',
    html: layout(`
      <h1 style="${STYLES.heading}">Welcome to CloudEdge!</h1>
      <p style="${STYLES.text}">Hi ${data.name || 'there'},</p>
      <p style="${STYLES.text}">Thanks for joining! You're now part of our community. Here's what you can do:</p>
      <ul style="${STYLES.text}">
        <li>Read members-only content</li>
        <li>Comment on posts</li>
        <li>Receive our weekly newsletter</li>
      </ul>
      <p style="text-align:center;margin:32px 0;">
        <a href="${data.siteUrl}" style="${STYLES.button}">Start Reading →</a>
      </p>
    `, data.siteUrl),
  }),

  'password-reset': (data: TemplateData): { subject: string; html: string } => ({
    subject: 'Reset your password — CloudEdge',
    html: layout(`
      <h1 style="${STYLES.heading}">Reset your password</h1>
      <p style="${STYLES.text}">Hi ${data.name || 'there'},</p>
      <p style="${STYLES.text}">We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="text-align:center;margin:32px 0;"><a href="${data.url}" style="${STYLES.button}">Reset Password</a></p>
      <p style="${STYLES.muted}">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
    `, data.siteUrl),
  }),

  'digest': (data: TemplateData & { posts?: { title: string; slug: string; excerpt: string }[] }): { subject: string; html: string } => ({
    subject: `Your weekly digest — CloudEdge`,
    html: layout(`
      <h1 style="${STYLES.heading}">This week on CloudEdge</h1>
      <p style="${STYLES.text}">Here's what's new:</p>
      ${(data.posts || []).map(p => `
        <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #eee;">
          <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;">
            <a href="${data.siteUrl}/${p.slug}" style="color:#0070f3;text-decoration:none;">${p.title}</a>
          </h2>
          <p style="${STYLES.muted}">${p.excerpt}</p>
        </div>
      `).join('')}
    `, data.siteUrl, data.unsubscribeUrl),
  }),
};

export type TemplateName = keyof typeof templates;
