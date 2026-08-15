import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await db.invitation.findUnique({ where: { token } });

  const isInvalid =
    !invitation || invitation.acceptedAt !== null || invitation.expiresAt < new Date();

  if (isInvalid) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invalid invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid, expired, or has already been used. Ask an admin to
            send you a new one.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set up your account</CardTitle>
        <CardDescription>
          You&apos;ve been invited to Erasight LMS as {invitation.role.toLowerCase()} (
          {invitation.email}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteForm token={token} email={invitation.email} />
      </CardContent>
    </Card>
  );
}
