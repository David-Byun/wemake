import { GithubIcon, LockIcon, MessageCircleIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Separator } from "~/common/components/ui/separator";

export default function AuthButtons() {
  return (
    <div className="w-1/2 flex flex-col items-center mt-10 space-y-2">
      <Separator className="w-full" />
      <span className="text-muted-foreground text-xs uppercase font-medium">
        Or Continue with
      </span>
      <Separator className="w-full" />
      {/* lucide에서 아이콘 검색해서 이용 */}
      <div className="flex flex-col gap-2 w-full mt-5">
        <Button variant={"outline"} className="w-full" asChild>
          <Link to="/auth/social/kakao/start">
            <MessageCircleIcon className="w-4 h-4 mr-2" />
            Kakao Talk
          </Link>
        </Button>
        <Button variant={"outline"} className="w-full" asChild>
          <Link to="/auth/social/github/start">
            <GithubIcon className="w-4 h-4 mr-2" />
            Github
          </Link>
        </Button>
        <Button variant={"outline"} className="w-full" asChild>
          <Link to="/auth/otp/start">
            <LockIcon className="w-4 h-4 mr-2" />
            OTP
          </Link>
        </Button>
      </div>
    </div>
  );
}
