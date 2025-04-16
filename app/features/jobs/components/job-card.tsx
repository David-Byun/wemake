import { Link } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { DateTime } from "luxon";

interface JobCardProps {
  id: number;
  title: string;
  company: string;
  companyLogoUrl: string;
  createdAt: string;
  type: string;
  positionLocation: string;
  companyHp: string;
  workType: string;
  salary: string;
}

export function JobCard({
  id,
  title,
  company,
  createdAt,
  type,
  positionLocation,
  workType,
  salary,
  companyLogoUrl,
  companyHp,
}: JobCardProps) {
  return (
    <Link to={`/jobs/${id}`}>
      <Card className="bg-transparent hover:bg-card/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={companyLogoUrl}
              alt={`${company} Logo`}
              className="size-10 rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-accent-foreground">{company}</span>
              <span className="text-xs text-muted-foreground">
                {DateTime.fromISO(createdAt).toRelative()}
              </span>
            </div>
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {workType}
          </Badge>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">
              {salary}
            </span>

            <span className="text-xs text-muted-foreground font-medium">
              {companyHp}
            </span>
          </div>
          <Button variant="secondary" size="sm">
            Apply now
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
