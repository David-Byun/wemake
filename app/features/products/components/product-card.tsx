import { Link } from "react-router";
import { ChevronUpIcon, EyeIcon, MessageCircleIcon } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  upvotes: string;
  views: string;
  comments: string;
}

export function ProductCard({
  id,
  name,
  description,
  upvotes,
  views,
  comments,
}: ProductCardProps) {
  return (
    <Link to={`/products/${id}`}>
      <Card className="w-full flex items-center justify-between bg-transparent hover:bg-card/50 ">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
            {name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-px text-xs text-muted-foreground">
              <MessageCircleIcon className="size-4" />
              <span className="text-sm font-light">{comments}</span>
            </div>
            <div className="flex items-center gap-px text-xs text-muted-foreground">
              <EyeIcon className="size-4" />
              <span className="text-sm font-light">{views}</span>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="py-0">
          <Button variant="outline" className="flex h-14 flex-col">
            <ChevronUpIcon className="size-4 shrink-0" />
            <span>{upvotes}</span>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
