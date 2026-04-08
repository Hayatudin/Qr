import React from "react";
import { useTranslation } from "react-i18next";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types/Product";
import { FilterState } from "@/components/FilterDrawer";

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error: string;
  searchQuery?: string;
  activeCategory?: string;
  filters?: FilterState;
  onFavoriteToggle: () => void;
}

export { type Product } from "@/types/Product";

export const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  error,
  searchQuery = "",
  activeCategory = "all",
  filters,
  onFavoriteToggle,
}) => {
  const { t, i18n } = useTranslation();

  const getTranslatedName = (product: Product) => {
    const lang = i18n.language;
    if (lang === 'am' && product.name_am) return product.name_am;
    if (lang === 'om' && product.name_om) return product.name_om;
    return product.name_en;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = getTranslatedName(product)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const matchesCategory =
      activeCategory === "all"
        ? product.type !== "room"
        : product.type === activeCategory;
    if (!matchesCategory) return false;

    if (filters) {
      const price = parseFloat(product.price.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(price) && price > filters.maxPrice) return false;

      if (product.rating < filters.minRating) return false;

      if (filters.dietary.length > 0 && activeCategory !== 'room') {
        const desc = ((product.description_en || '') + ' ' + getTranslatedName(product)).toLowerCase();
        const hasDietary = filters.dietary.some(diet => desc.includes(diet.toLowerCase()));
        if (!hasDietary) return false;
      }

      if (filters.bedrooms !== 'all' && activeCategory === 'room') {
         const desc = ((product.description_en || '') + ' ' + getTranslatedName(product)).toLowerCase();
         if (filters.bedrooms === '1' && !desc.includes('1 bed') && !desc.includes('1 room') && !desc.includes('single')) return false;
         if (filters.bedrooms === '2' && !desc.includes('2 bed') && !desc.includes('2 room') && !desc.includes('double')) return false;
         if (filters.bedrooms === '3+' && !desc.includes('3 bed') && !desc.includes('3 room') && !desc.includes('4 bed')) return false;
      }
    }

    return true;
  });

  if (filters) {
    filteredProducts.sort((a, b) => {
      const priceA = parseFloat(a.price.toString().replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(b.price.toString().replace(/[^0-9.]/g, '')) || 0;
      
      if (filters.sortBy === 'price_asc') {
        return priceA - priceB;
      }
      if (filters.sortBy === 'price_desc') {
        return priceB - priceA;
      }
      return 0; // recommended
    });
  }

  if (isLoading)
    return <div className="text-center py-8 text-muted-foreground">{t('messages.loading')}</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;

  const leftColumn = filteredProducts.filter((_, index) => index % 2 === 0);
  const rightColumn = filteredProducts.filter((_, index) => index % 2 === 1);

  return (
    <section
      className="w-full mt-3"
      aria-label="Product list"
    >
      <div className="grid grid-cols-2 gap-3 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {leftColumn.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              onFavoriteToggle={onFavoriteToggle}
              index={i * 2}
            />
          ))}
        </div>
        {/* Right Column, staggered push down */}
        <div className="flex flex-col gap-3">
          {rightColumn.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              onFavoriteToggle={onFavoriteToggle}
              index={i * 2 + 1}
            />
          ))}
        </div>
      </div>
      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('messages.no_products')}</p>
        </div>
      )}
    </section>
  );
};