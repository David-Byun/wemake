import type { DateTime } from "luxon";
import { PAGE_SIZE } from "./constants";
import pkg from "@supabase/supabase-js";
import { type Database } from "~/supa-client";

/* #7.2 
client 파일을 수정했기 때문에(import client from "~/supa-client");
쿼리 파일에 있는 모든 client 인스턴트들을 SSR 클라이언트로 교체해줘야함 
우리가 만든 쿼리를 리팩토링해야한다는 의미 : 유저의 요청을 받을 수 있도록
서버사이드 렌더링 대신에 클라이언트 사이드 렌더링을 사용한다면 이렇게 할 필요가 없다.

클라이언트 사이드 렌더링로 할때 리팩토링 > homepage 부분: 
1) loader 를 clientLoader로 교체
2) const { data, error } = await browserClient client를 browserClient로 교체
    .from("products")
 
*/

export const productListSelect = `product_id, name, tagline, upvotes:stats->>upvotes, views:stats->>views, reviews:stats->>reviews`;

/* #6.0 생성. limit : pagination 용*/
//#7.2 client 추가한 내용들 다른 페이지도 전부 같은 작업 필요
export const getProductsByDateRange = async (
  client: pkg.SupabaseClient<Database>,
  {
    startDate,
    endDate,
    limit,
    page = 1,
  }: {
    startDate: DateTime;
    endDate: DateTime;
    limit: number;
    page?: number;
  }
) => {
  const { data, error } = await client
    .from("products")
    //json 형식에서 저장된 항목을 가져오려면 ->> 사용. 다 붙여서 보여줘야 함
    .select(productListSelect)
    //https://supabase.com/docs/reference/javascript/select
    .order("stats->>upvotes", { ascending: false })
    .gte("created_at", startDate.toISO())
    .lte("created_at", endDate.toISO())
    .order("created_at", { ascending: false })
    /* limit 대신 range를 사용하는데 SQL Command로 구현하면 LIMIT와 OFFSET이 됨(size와 page-1를 곱한만큼 건너뛰어(offset) 주는 것) 
    page 1 일때 0, 15 (0부터 시작하므로 -1을 빼고 PAGE_SIZE를 곱함)
    page 2 일때 15, 30
    page 3 일때 30, 45
    */
    .range(page - 1 * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;
  return data;
};

/* #6.1 Product Pagination 
우리가 알고 싶은건 이 기간의 product의 개수이다.
<ProductPagination totalPages={10} /> 에는 totalPages가 필요하다.
이제 아래 함수를 pagination이 필요한 모든 page에 적용해야함
*/
export const getProductPagesByDateRange = async (
  client: pkg.SupabaseClient<Database>,
  {
    startDate,
    endDate,
  }: {
    startDate: DateTime;
    endDate: DateTime;
  }
) => {
  const { count, error } = await client
    .from("products")
    // count 방식이 다양하게 있는데, exact 방식은 정확한 개수를 반환한다. head: true 는 data를 return 하지 않고 개수만 return 한다.
    .select("product_id", { count: "exact", head: true })
    .gte("created_at", startDate.toISO())
    .lte("created_at", endDate.toISO());
  if (error) throw error;
  if (!count) return 1;
  return Math.ceil(count / PAGE_SIZE);
};

// #6.6 카테고리
export const getCategories = async (client: pkg.SupabaseClient<Database>) => {
  const { data, error } = await client
    .from("categories")
    .select("category_id, name, description");
  if (error) throw error;
  return data;
};

export const getCategory = async (
  client: pkg.SupabaseClient<Database>,
  { categoryId }: { categoryId: number }
) => {
  const { data, error } = await client
    .from("categories")
    .select("category_id, name, description")
    //.eq : equal
    .eq("category_id", categoryId)
    //한개만 원하므로 single. query가 다량의 row를 반환하는데 single을 호출하면 에러가 발생
    .single();
  if (error) throw error;
  return data;
};

//그냥 변수만 넣으면 getProductsByCategory(1,3) 형태이므로 object 형태로 해줘야함
export const getProductsByCategory = async (
  client: pkg.SupabaseClient<Database>,
  {
    categoryId,
    page = 1,
  }: {
    categoryId: number;
    page?: number;
  }
) => {
  const { data, error } = await client
    .from("products")
    .select(productListSelect)
    .eq("category_id", categoryId)
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;
  return data;
};

export const getCategoryPages = async (
  client: pkg.SupabaseClient<Database>,
  { categoryId }: { categoryId: number }
) => {
  const { count, error } = await client
    .from("products")
    .select("product_id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  if (error) throw error;
  if (!count) return 1;
  return Math.ceil(count / PAGE_SIZE);
};

/* #6.7 Product Search. 
sql에서 description 을 select 하는게 아니라 tagline을 select 하는 것으로 변경해서 다음과 같이 함
1. npm run typecheck 해보면 typescript 문제가 발생하는 곳 전부를 볼 수 있음 
2. cursor 편집 > 파일에서 바꾸기 product.tagline > product.tagline 으로 변경
*/
export const getProductsBySearch = async (
  client: pkg.SupabaseClient<Database>,
  {
    query,
    page = 1,
  }: {
    query: string;
    page?: number;
  }
) => {
  const { data, error } = await client
    .from("products")
    .select(productListSelect)
    //ilike : query 키워드로 검색하는데, 여기서 발생하는 문제는 기본적으로 이 filter가 순서대로 실행된다는 것이다.
    // .ilike("tagline", `%${query}%`)
    // .ilike("name", `%${query}%`)
    // 그래서 or를 사용하는데 or를 사용하지 않으면 기본적으로 SQL AND를 사용하는 것과 같다.
    .or(`name.ilike.%${query}%, tagline.ilike.%${query}%`)
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;
  return data;
};

export const getPagesBySearch = async (
  client: pkg.SupabaseClient<Database>,
  { query }: { query: string }
) => {
  const { count, error } = await client
    .from("products")
    .select("product_id", { count: "exact", head: true })
    .or(`name.ilike.%${query}%, tagline.ilike.%${query}%`);
  if (error) throw error;
  if (!count) return 1;
  return Math.ceil(count / PAGE_SIZE);
};

/* #6.8 view 생성해서 이용하면 데이터들이 nullable된다. 
이를 수정하기 위해 supa-client로 이동해서 아래 내용 추가
        product_overview_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["product_overview_view"]["Row"]
          >;
        };
*/
export const getProductById = async (
  client: pkg.SupabaseClient<Database>,
  { productId }: { productId: number }
) => {
  const { data, error } = await client
    .from("product_overview_view")
    .select("*")
    .eq("product_id", productId)
    .single();
  if (error) throw error;
  return data;
};

export const getReviews = async (
  client: pkg.SupabaseClient<Database>,
  { productId }: { productId: number }
) => {
  const { data, error } = await client
    .from("reviews")
    .select(
      `
      review_id,
      rating,
      review,
      created_at,
      user:profiles!inner(
        name, username, avatar
      )
      `
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
