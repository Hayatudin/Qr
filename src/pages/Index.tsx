import React, { useState, useEffect, useCallback } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ProductList, Product } from '@/components/ProductList';
import { BottomNavigation } from '@/components/BottomNavigation';
import { FilterDrawer, FilterState, initialFilterState } from '@/components/FilterDrawer';
import { useUser } from '@/contexts/UserContext';

import { RoomBadge } from '@/components/RoomBadge';
import { FloatingCart } from '@/components/FloatingCart';
import { FloatingCallWaiter } from '@/components/FloatingCallWaiter';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  const { user } = useUser();

  const fetchServicesAndFavorites = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [servicesRes, favoritesRes] = await Promise.all([
        fetch("http://localhost:8000/api/services.php"),
        user ? fetch(`http://localhost:8000/api/favorites.php?user_id=${user.id}`) : Promise.resolve(null)
      ]);

      if (!servicesRes.ok) throw new Error('Failed to fetch services');

      const servicesData = await servicesRes.json();
      let favoriteIds = new Set();

      if (favoritesRes && favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        if(!favoritesData.error){
            favoriteIds = new Set(favoritesData.map((fav: any) => fav.service_id));
        }
      }

      if (servicesData.error) throw new Error(servicesData.error);

      setProducts(servicesData.map((item: any) => ({
        ...item,
        price: item.price,
        rating: 5,
        reviewCount: "0",
        image: item.image_url || "/placeholder.svg",
        isFavoritedInitially: favoriteIds.has(item.id),
      })));

    } catch (e: any) {
      setError(e.message || "Failed to load services.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchServicesAndFavorites();
  }, [fetchServicesAndFavorites]);

  return (
    <div className="bg-background text-foreground flex max-w-[480px] w-full flex-col overflow-x-hidden mx-auto min-h-screen pb-28">
      <div className="relative w-full">
        <RoomBadge />
        <HeroSection />
      </div>

      <main className="flex flex-col w-full flex-1 px-5 relative z-10 bg-background rounded-t-[32px] -mt-[40px] pt-6 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
        <SearchBar onSearch={setSearchQuery} onFilterClick={() => setIsFilterOpen(true)} />
        <CategoryTabs onCategoryChange={setActiveCategory} />
        <ProductList
          products={products}
          isLoading={isLoading}
          error={error}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          filters={filters}
          onFavoriteToggle={fetchServicesAndFavorites}
        />
      </main>

      <FloatingCart />
      <FloatingCallWaiter />
      <BottomNavigation />

      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={setIsFilterOpen}
        activeCategory={activeCategory}
        initialFilters={filters}
        onApplyFilters={setFilters}
      />
    </div>
  );
};

export default Index;
