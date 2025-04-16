import * as pkg from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

export const createProduct = async (
  client: pkg.SupabaseClient<Database>,
  //   {...rest} : Product rest로 받을수도 있는데 어떤 변수가 있는지 정확히 알기 위해서 개별로 받는걸 추천(#8.12)
  {
    name,
    tagline,
    url,
    description,
    howItWorks,
    iconUrl,
    userId,
    categoryId,
  }: {
    name: string;
    tagline: string;
    url: string;
    description: string;
    howItWorks: string;
    iconUrl: string;
    userId: string;
    categoryId: number;
  }
) => {
  const { data, error } = await client
    .from("products")
    .insert({
      name,
      tagline,
      description,
      how_it_works: howItWorks,
      url,
      icon: iconUrl,
      category_id: categoryId,
      profile_id: userId,
    })
    .select("product_id")
    .single();
  if (error) throw error;
  return data.product_id;
};

export const createProductReview = async (
  client: pkg.SupabaseClient<Database>,
  {
    productId,
    userId,
    rating,
    review,
  }: {
    productId: number;
    userId: string;
    rating: number;
    review: string;
  }
) => {
  const { error } = await client.from("reviews").insert({
    product_id: Number(productId),
    profile_id: userId,
    rating,
    review,
  });
  if (error) throw error;
};
