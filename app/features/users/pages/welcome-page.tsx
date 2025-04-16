import { Resend } from "resend";
import type { Route } from "./+types/welcome-page";
import VercelInviteUserEmail from "react-email-starter/emails/vercel-invite-user";

const client = new Resend(process.env.RESEND_API_KEY);

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { data, error } = await client.emails.send({
    from: "David <david@mail.wemake.baby>",
    to: ["byundavid@naver.com"],
    subject: "Welcome to Wemake.baby",
    react: <VercelInviteUserEmail username={params.username} />,
  });
  return Response.json({ data, error });
};
