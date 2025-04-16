import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/categories-page";
import { CategoryCard } from "../components/category-card";
import { makeSSRClient } from "~/supa-client";
import { getCategories } from "../queries";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const categories = await getCategories(client);
  return { categories };
};

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Categories | Product Hunt Clone" },
    { name: "description", content: "Browse products by category" },
  ];
};

export default function CategoriesPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <PageHeader title="Categories" subtitle="Browse products by category" />
      <div className="grid grid-cols-4 gap-10">
        {/* abstract to /features/products/components/category-card.tsx use content as props*/}
        {loaderData.categories.map((category) => (
          <CategoryCard
            id={category.category_id}
            name={category.name}
            description={category.description}
          />
        ))}
      </div>
    </div>
  );
}
