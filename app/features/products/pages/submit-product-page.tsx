import { PageHeader } from "~/common/components/page-header";
import { Form, redirect } from "react-router";
import { Label } from "~/common/components/ui/label";
import { Input } from "~/common/components/ui/input";
import { InputPair } from "~/common/components/input-pair";
import SelectPair from "~/common/components/select-pair";
import { useState } from "react";
import { Button } from "~/common/components/ui/button";
import type { Route } from "./+types/submit-product-page";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";
import { z } from "zod";
import { getCategories } from "../queries";
import { createProduct } from "../mutations";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Submit Product | Product Hunt Clone" },
    { name: "description", content: "Submit your product" },
  ];
};

const formSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  url: z.string().min(1),
  description: z.string().min(1),
  //action에는 string 으로 도착할 거지만, 우리의 database의 필요에 맞게 number로 바꾸고 싶으니까. schema 상 category_id가 bigint 타입이라서(#8.12)
  category: z.coerce.number(),
  howItWorks: z.string().min(1),
  icon: z.instanceof(File).refine((file) => {
    return file.size <= 2097152 && file.type.startsWith("image/");
  }),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  //여기 loader에서 우린 이 페이지를 보호하고 있어. 이 페이지에 접근하기 위해서는 로그인 해야하니까(#8.12)
  const userId = await getLoggedInUserId(client);
  const categories = await getCategories(client);
  //categories가 아니고 {categories} 인 이유는 ?
  return { categories };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { data, success, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return { formErrors: error.flatten().fieldErrors };
  }
  const { icon, ...rest } = data;
  //uploadData path를 가져오기 위해서(#8.12)
  const { data: uploadData, error: uploadError } = await client.storage
    .from("icons")
    .upload(`${userId}/${Date.now()}`, icon, {
      contentType: icon.type,
      upsert: false,
    });
  if (uploadError) {
    return { formErrors: { icon: ["Failed to upload icon"] } };
  }
  const {
    data: { publicUrl },
  } = await client.storage.from("icons").getPublicUrl(uploadData.path);
  //product schema에는 프로필id와 카테고리id가 필요(#8.12)
  const productId = await createProduct(client, {
    name: rest.name,
    tagline: rest.tagline,
    description: rest.description,
    howItWorks: rest.howItWorks,
    url: rest.url,
    iconUrl: publicUrl,
    userId,
    categoryId: rest.category,
  });
  return redirect(`/products/${productId}`);
};

//npx shadcn@latest add label
export default function SubmitPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  // state에 file을 저장하는 대신 file의 url을 저장함
  const [icon, setIcon] = useState<string | null>(null);
  /*
    file upload를 하면, input이 변경됨. 이때 event를 수신함 그 event를 통해 이 function을 trigger한 HTML Input Element에 접근할 수 있음
    Input element이기 때문에 files를 가지고 있음
  */
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      /* 
        files는 여러개의 file을 가지고 있을수 있음. input의 multiple 속성을 추가하면 여러개의 파일을 업로드할 수 있음 
        우리가 file을 선택하면 그 file은 browser의 memory에 위치하게 됨
        이건 memory에 있는 파일을 노출시키는 역할을 함
      */
      const file = event.target.files[0];
      /*
        다음으로 할일은 browser의 memory 영역으로부터 url을 가져옴. 그걸 위한게 URL.createObjectURL(file)
        이 function은 file을 선택한 browser 내에서만 동작하는 URL을 생성함(public URL은 아님)
        주는 URL을 통해 사용자에게 file을 보여줄 수 있음
      */
      setIcon(URL.createObjectURL(file));
    }
  };
  return (
    <div>
      <PageHeader
        title="Submit Your Product"
        subtitle="Submit your product to the community"
      />
      {/* form 내부에 단독으로 만들어진 button은 언제나 submit을 처리하게 되어 있음 */}
      <Form
        className="grid grid-cols-2 gap-10 max-w-screen-lg mx-auto w-full"
        method="post"
        encType="multipart/form-data"
      >
        {/* 수직으로 배열 */}
        <div className="space-y-5">
          {/* 이번에는 추상화를 AI에 맡기지 않고 직접함. 정교한 부분이 많이 필요함. 특히 타입스크립트. input-pair.tsx 파일 만듦*/}
          <InputPair
            label="Product Name"
            description="What is your product?"
            id="name"
            name="name"
            type="text"
            required
            placeholder="Name of your product"
          />
          {actionData?.formErrors?.name && (
            <p className="text-red-500">{actionData.formErrors.name}</p>
          )}
          <InputPair
            label="Tagline"
            description="60 characters or less"
            id="tagline"
            name="tagline"
            type="text"
            required
            placeholder="A concise description of your product"
          />
          {actionData?.formErrors?.tagline && (
            <p className="text-red-500">{actionData.formErrors.name}</p>
          )}
          <InputPair
            label="URL"
            description="URL of your product"
            id="url"
            name="url"
            type="text"
            required
            placeholder="https://example.com"
          />
          {actionData?.formErrors?.url && (
            <p className="text-red-500">{actionData.formErrors.url}</p>
          )}
          <InputPair
            label="Description"
            description="Describe your product"
            id="description"
            name="description"
            type="text"
            required
            placeholder="Describe your product"
            textArea={true}
          />
          {actionData?.formErrors?.description && (
            <p className="text-red-500">{actionData.formErrors.description}</p>
          )}
          <InputPair
            label="How it works"
            description="How does your product work?"
            id="howItWorks"
            name="howItWorks"
            type="text"
            required
            placeholder="How does your product work?"
            textArea={true}
          />
          {actionData?.formErrors?.howItWorks && (
            <p className="text-red-500">{actionData.formErrors.howItWorks}</p>
          )}
          {/* npx shadcn@latest add select */}
          <SelectPair
            label="Category"
            description="The category of your product"
            name="category"
            required
            placeholder="Select a category"
            options={loaderData.categories.map((category) => ({
              label: category.name,
              value: category.category_id.toString(),
            }))}
            // options={[
            //   { label: "AI", value: "ai" },
            //   { label: "Design", value: "design" },
            //   { label: "Developer Tools", value: "developer-tools" },
            //   { label: "Education", value: "education" },
            //   { label: "Entertainment", value: "entertainment" },
            //   { label: "Finance", value: "finance" },
            //   { label: "Health", value: "health" },
            //   { label: "Productivity", value: "productivity" },
            // ]}
          />
          {actionData?.formErrors?.category && (
            <p className="text-red-500">{actionData.formErrors.category}</p>
          )}
          <Button type="submit" className="w-full" size="lg">
            Submit
          </Button>
        </div>

        <div className="flex flex-col space-y-2">
          {icon ? (
            <div className="size-40 rounded-xl shadow-xl overflow-hidden">
              {/*icon : file이 저장되어 있는 browser의 memory 영역을 참조하는 URL 값을 가짐 */}
              <img
                src={icon}
                alt="icon"
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
          <Label className="flex flex-col gap-1">
            Icon{" "}
            <small className="text-muted-foreground">
              A square image that represents your product
            </small>
          </Label>
          {/* Input에 multiple 속성을 추가하면 여러개의 파일을 업로드할 수 있음 */}
          <Input
            type="file"
            className="w-1/2"
            onChange={onChange}
            required
            name="icon"
          />
          {actionData?.formErrors?.icon && (
            <p className="text-red-500">{actionData.formErrors.icon}</p>
          )}
          <div className="flex flex-col text-sm">
            <span className="text-sm text-muted-foreground">
              Recommended size: 1024x1024
            </span>
            <span className="text-sm text-muted-foreground">
              Allowed formats: PNG, JPG, or SVG
            </span>
            <span className="text-sm text-muted-foreground">
              Max file size : 1MB
            </span>
          </div>
        </div>
      </Form>
    </div>
  );
}
