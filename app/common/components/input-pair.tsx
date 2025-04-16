import type { InputHTMLAttributes } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

/* 
    input과 label을 페어링하고 있기 때문에 pair로 명명함 
    InputPair가 Input의 Prop은 뭐든지 입력받을 수 있다는 뜻임(id, name, type 등)
*/
export function InputPair({
  label,
  description,
  textArea = false,
  ...rest
}: {
  label: string;
  description: string;
  textArea?: boolean;
} & InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) {
  return (
    <div className="space-y-2 flex flex-col">
      {/* Input에 id가 입력되는 경우에는 Label과 연결되도록 하고 싶음 */}
      <Label htmlFor={rest.id} className="flex flex-col gap-1">
        {label}
        <small className="text-muted-foreground">{description}</small>
      </Label>
      {/* npx shadcn@latest add textarea. textArea 영역 크기 조절 못하게 하려면 className="resize-none" 추가 */}
      {textArea ? (
        <Textarea rows={4} className="resize-none" {...rest} />
      ) : (
        <Input {...rest} />
      )}
    </div>
  );
}
