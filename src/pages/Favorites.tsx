import React, { useState, useEffect, useCallback } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ProductCard } from '@/components/ProductCard';
import { useUser } from '@/contexts/UserContext';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types/Product';

const Favorites = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/api/favorites.php?user_id=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch favorites');

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const mappedFavorites: Product[] = data.map((fav: any) => ({
        ...fav,
        id: fav.service_id,
        isFavoritedInitially: true,
        rating: fav.rating || 5,
        reviewCount: fav.reviewCount || "0",
        image: fav.image_url || "/placeholder.svg",
      }));
      setFavorites(mappedFavorites);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  if (!user) {
    return (
      <div className="bg-background flex max-w-[480px] w-full flex-col overflow-hidden mx-auto min-h-screen pb-28">
        <main className="flex flex-col w-full flex-1 px-5 pt-14 items-center justify-center">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">{t('favorites.login_prompt')}</p>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="bg-background flex max-w-[480px] w-full flex-col overflow-hidden mx-auto min-h-screen pb-28 page-transition">
      <main className="flex flex-col w-full flex-1 px-5 pt-14">
        <h1 className="text-2xl font-bold text-foreground mb-5">Favorite</h1>
        {isLoading && <p className="text-center text-muted-foreground">{t('messages.loading')}</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!isLoading && !error && favorites.length > 0 && (
          <div className="grid grid-cols-2 gap-3 items-start mt-3">
             <div className="flex flex-col gap-3">
                {favorites.filter((_, i) => i % 2 === 0).map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onFavoriteToggle={fetchFavorites}
                    index={i * 2}
                  />
                ))}
            </div>
            <div className="flex flex-col gap-3">
                {favorites.filter((_, i) => i % 2 === 1).map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onFavoriteToggle={fetchFavorites}
                    index={i * 2 + 1}
                  />
                ))}
            </div>
          </div>
        )}
        {!isLoading && !error && favorites.length === 0 && (
          <div className="text-center mt-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">{t('favorites.empty_title')}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{t('favorites.empty_description')}</p>
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Favorites;