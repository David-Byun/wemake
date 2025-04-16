import { Label } from "~/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState } from "react";

export default function SelectPair({
  label,
  description,
  name,
  required,
  placeholder,
  options,
  defaultValue,
}: {
  label: string;
  description: string;
  name: string;
  required?: boolean;
  placeholder: string;
  options: {
    label: string;
    value: string;
  }[];
  defaultValue?: string;
}) {
  //Label 과 연결하기 위한 작업
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2 flex flex-col w-full">
      <Label className="flex flex-col gap-1" onClick={() => setOpen(true)}>
        {label}
        <small className="text-muted-foreground">{description}</small>
      </Label>
      {/* 
        onOpenChange : 열리거나 닫힐때 호출되는 function 
        사용자가 창을 닫을 때는 false, 열 때는 true
      */}
      <Select
        name={name}
        required={required}
        onOpenChange={setOpen}
        open={open}
        defaultValue={defaultValue}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
