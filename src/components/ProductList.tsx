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
import { ChevronDown, ChevronUp } from "lucide-react";
import { foodSubcategories, drinkSubcategories } from "@/constants/categories";

const SubcategoryGroup = ({ title, products, onFavoriteToggle }: { title: string, products: Product[], onFavoriteToggle: () => void }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  
  if (products.length === 0) return null;

  const leftColumn = products.filter((_, index) => index % 2 === 0);
  const rightColumn = products.filter((_, index) => index % 2 === 1);

  return (
    <div className="mb-8 w-full animate-in fade-in slide-in-from-bottom-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full pb-2 mb-4 border-b-2 border-foreground/10 group cursor-pointer focus:outline-none"
      >
        <h3 className="text-lg font-bold font-montserrat tracking-wide text-foreground group-hover:text-primary transition-colors text-left uppercase">
          {title}
        </h3>
        {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /> : <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />}
      </button>
      
      <div className={`grid grid-cols-2 gap-3 items-start transition-all duration-300 origin-top overflow-hidden ${isOpen ? 'opacity-100 max-h-[5000px] mt-2' : 'opacity-0 max-h-0'}`}>
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
    </div>
  );
};

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

  let subcategoriesToDisplay: string[] = [];
  if (activeCategory === 'food') subcategoriesToDisplay = [...foodSubcategories, "Other"];
  else if (activeCategory === 'drink') subcategoriesToDisplay = [...drinkSubcategories, "Other"];
  else if (activeCategory === 'all') subcategoriesToDisplay = [...foodSubcategories, ...drinkSubcategories, "Other"];

  return (
    <section
      className="w-full mt-3"
      aria-label="Product list"
    >
      {['all', 'food', 'drink'].includes(activeCategory) ? (
        <div className="w-full">
          {subcategoriesToDisplay.map(subCategoryName => {
            const groupProducts = filteredProducts.filter(p => (p.subcategory || "Other") === subCategoryName);
            if (!groupProducts || groupProducts.length === 0) return null;
            return <SubcategoryGroup key={subCategoryName} title={subCategoryName} products={groupProducts} onFavoriteToggle={onFavoriteToggle} />;
          })}
          {/* Output any unaccounted categories just in case */}
          {Array.from(new Set(filteredProducts.map(p => p.subcategory || 'Other')))
               .filter(k => !subcategoriesToDisplay.includes(k))
               .map(subCategoryName => {
                 const groupProducts = filteredProducts.filter(p => (p.subcategory || "Other") === subCategoryName);
                 return <SubcategoryGroup key={subCategoryName} title={subCategoryName} products={groupProducts} onFavoriteToggle={onFavoriteToggle} />;
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="flex flex-col gap-3">
            {filteredProducts.filter((_, index) => index % 2 === 0).map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                onFavoriteToggle={onFavoriteToggle}
                index={i * 2}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {filteredProducts.filter((_, index) => index % 2 === 1).map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                onFavoriteToggle={onFavoriteToggle}
                index={i * 2 + 1}
              />
            ))}
          </div>
        </div>
      )}
      
      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('messages.no_products')}</p>
        </div>
      )}
    </section>
  );
};