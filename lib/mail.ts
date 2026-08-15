import nodemailer from "nodemailer";

// Sends through the operator's personal Gmail account via SMTP, authenticated
// with a Google App Password (requires 2FA enabled on that account) rather
// than the account's real password.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendInvitationEmail({
  to,
  role,
  inviteUrl,
  invitedByName,
}: {
  to: string;
  role: string;
  inviteUrl: string;
  invitedByName: string;
}) {
  await transporter.sendMail({
    from: `Erasight LMS <${process.env.GMAIL_USER}>`,
    to,
    subject: "You've been invited to Erasight LMS",
    text: `${invitedByName} invited you to join Erasight LMS as ${role.toLowerCase()}.\n\nAccept your invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
    html: `
      <p>${invitedByName} invited you to join <strong>Erasight LMS</strong> as <strong>${role.toLowerCase()}</strong>.</p>
      <p><a href="${inviteUrl}">Accept your invitation</a></p>
      <p style="color:#666;font-size:13px">This link expires in 7 days. If the button doesn't work, copy this URL: ${inviteUrl}</p>
    `,
  });
}
