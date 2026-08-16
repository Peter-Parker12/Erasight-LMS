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
  classNames,
}: {
  to: string;
  role: string;
  inviteUrl: string;
  invitedByName: string;
  classNames?: string[];
}) {
  const classesText = classNames?.length
    ? `\n\nYou're being granted access to:\n${classNames.map((c) => `- ${c}`).join("\n")}`
    : "";
  const classesHtml = classNames?.length
    ? `<p>You're being granted access to:</p><ul>${classNames.map((c) => `<li>${c}</li>`).join("")}</ul>`
    : "";

  await transporter.sendMail({
    from: `Erasight LMS <${process.env.GMAIL_USER}>`,
    to,
    subject: "You've been invited to Erasight LMS",
    text: `${invitedByName} invited you to join Erasight LMS as ${role.toLowerCase()}.${classesText}\n\nAccept your invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
    html: `
      <p>${invitedByName} invited you to join <strong>Erasight LMS</strong> as <strong>${role.toLowerCase()}</strong>.</p>
      ${classesHtml}
      <p><a href="${inviteUrl}">Accept your invitation</a></p>
      <p style="color:#666;font-size:13px">This link expires in 7 days. If the button doesn't work, copy this URL: ${inviteUrl}</p>
    `,
  });
}
