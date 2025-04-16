import { Form } from "react-router";
import type { Route } from "./+types/settings-page";
import { InputPair } from "~/common/components/input-pair";
import SelectPair from "~/common/components/select-pair";
import { useState } from "react";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { Label } from "~/common/components/ui/label";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId, getUserById } from "../queries";
import { z } from "zod";
import { updateUser, updateUserAvatar } from "../mutations";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/common/components/ui/alert";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Settings | wemake" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  // 기억 : 현재 로그인한 사용자의 userId를 가져오기 위한 이유도 있지만, 우리의 loader를 보호하기 위한 이유도 있음
  const userId = await getLoggedInUserId(client);
  const user = await getUserById(client, { id: userId });
  return { user };
};

//username 수정하는 기능도 넣으면 좋은데, 그 username을 사용하는 다른 사용자가 없는지 꼭 확인해야함
const formSchema = z.object({
  name: z.string().min(1),
  role: z.string(),
  headline: z.string().optional().default(""),
  bio: z.string().optional().default(""),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  //여기 이름은 input의 name 과 같아야 함
  const avatar = formData.get("avatar");
  if (avatar && avatar instanceof File) {
    if (avatar.size <= 2097152 && avatar.type.startsWith("image/")) {
      /* upload는 path를 설정해야 하는데 기본적으로 여러분이 bucket안에 파일을 저장할 위치를 뜻함(#8.10). 우리는 path를 userId 값으로 함 
          upsert는 만약 존재하지 않는다면 생성하고, 만약 존재한다면 overwrite함
      */
      const { data, error } = await client.storage
        .from("avatars")
        // (#8.11) 새로고침하면 이전파일로 남아 있는 현상 수정하기 위해서 upload 하는 곳을 다르게
        .upload(`${userId}/${Date.now()}`, avatar, {
          contentType: avatar.type,
          upsert: false,
        });
      // upload avatar
      // update user with avatar url
      if (error) {
        console.log(error);
        return { formErrors: { avatar: ["Failed to upload avatar"] } };
      }
      //이 publicUrl을 사용해서 우린 사용자 프로필을 업데이트 할 거다.
      const {
        data: { publicUrl },
      } = await client.storage.from("avatars").getPublicUrl(data.path);
      await updateUserAvatar(client, {
        id: userId,
        avatarUrl: publicUrl,
      });
    } else {
      return { formErrors: { avatar: ["Invalid file size or type"] } };
    }
  } else {
    const { success, data, error } = formSchema.safeParse(
      Object.fromEntries(formData)
    );
    if (!success) {
      return {
        formErrors: error.flatten().fieldErrors,
      };
    }
    const { name, role, headline, bio } = data;
    await updateUser(client, {
      id: userId,
      name,
      role: role as
        | "developer"
        | "designer"
        | "marketer"
        | "founder"
        | "product-manager",
      headline,
      bio,
    });
    //프로필이 성공적으로 업데이트되었습니다 같은 알림을 보여주고 싶을 수 있으니까 ok true를 확인해서 사용하면 됨
    return { ok: true };
  }
};

export default function SettingsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  // state에 file을 저장하는 대신 file의 url을 저장함
  // 변경된 사항이 실시간으로 보여지게 하기 위해서  (loaderData.user.avatar) 추가 그런데 이 경우 브라우저에서 예전값 가지고 있어서 새로고침하면 다시
  // 이전 파일이 보임(#8.11)
  const [avatar, setAvatar] = useState<string | null>(loaderData.user.avatar);
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
      setAvatar(URL.createObjectURL(file));
    }
  };
  return (
    <div className="space-y-20">
      <div className="grid grid-cols-6 gap-40">
        <div className="col-span-4 flex flex-col gap-10">
          {actionData?.ok ? (
            <Alert>
              <AlertTitle>Profile updated successfully</AlertTitle>
              <AlertDescription>
                Your profile has been updated successfully.
              </AlertDescription>
            </Alert>
          ) : null}
          <h2 className="text-2xl font-semibold">Edit Profile</h2>
          <Form className="flex flex-col gap-5 w-1/2" method="post">
            <InputPair
              label="Name"
              description="your public name"
              name="name"
              type="text"
              required
              id="name"
              placeholder="John Doe"
              defaultValue={loaderData.user.name}
            />
            {actionData?.formErrors && "role" in actionData.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors.role}
                </AlertDescription>
              </Alert>
            ) : null}
            <SelectPair
              label="Role"
              description="What role do you want to be?"
              name="role"
              //옵션 원한다면 constant로 관리해도 됨(커뮤니티 게시글에서 볼 수 있음))
              options={[
                { label: "Designer", value: "designer" },
                { label: "Developer", value: "developer" },
                { label: "Marketer", value: "marketer" },
                { label: "Other", value: "other" },
              ]}
              placeholder="Select your role"
              defaultValue={loaderData.user.role}
            />
            <InputPair
              label="Headline"
              description="An introduction to your profile"
              name="headline"
              type="text"
              required
              textArea
              id="headline"
              placeholder="I'm a software engineer..."
              defaultValue={loaderData.user.headline ?? ""}
            />
            {actionData?.formErrors && "headline" in actionData.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors.headline}
                </AlertDescription>
              </Alert>
            ) : null}
            <InputPair
              label="Bio"
              description="Your public bio. It can be edited later."
              name="bio"
              type="text"
              required
              textArea
              id="bio"
              placeholder="I'm a software engineer..."
              defaultValue={loaderData.user.bio ?? ""}
            />
            {actionData?.formErrors && "bio" in actionData.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{actionData.formErrors.bio}</AlertDescription>
              </Alert>
            ) : null}
            <Button className="w-full">Update Profile</Button>
          </Form>
        </div>
        {/* 정말 중요한 건데 encoding type을 변경(#8.10) */}
        <Form
          className="col-span-2 p-6 rounded-lg border shadow-md space-y-4"
          method="post"
          encType="multipart/form-data"
        >
          <Label className="flex flex-col gap-1">
            Avatar{" "}
            <small className="text-muted-foreground">
              This is your public avatar
            </small>
          </Label>
          {/* flex flex-col gap-4 또는 space-y-4 주면 됨 */}
          <div className="space-y-5">
            <div className="size-40 rounded-full shadow-xl overflow-hidden bg-primary/50">
              {avatar ? (
                //icon : file이 저장되어 있는 browser의 memory 영역을 참조하는 URL 값을 가짐
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            {/* Input에 multiple 속성을 추가하면 여러개의 파일을 업로드할 수 있음 */}
            <Input
              type="file"
              className="w-1/2"
              onChange={onChange}
              required
              name="avatar"
            />
            {actionData?.formErrors && "avatar" in actionData.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors.avatar}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-col text-xs">
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
            <Button className="w-full">Update Avatar</Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
