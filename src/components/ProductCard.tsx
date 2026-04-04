import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { Product } from '@/types/Product';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onFavoriteToggle?: () => void;
  index?: number;
}

const getTranslated = (product: Product, field: 'name' | 'description', lang: string) => {
  const key = `${field}_${lang}` as keyof Product;
  const fallbackKey = `${field}_en` as keyof Product;
  return product[key] || product[fallbackKey];
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onFavoriteToggle, index = 0 }) => {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(product.isFavoritedInitially);

  const displayName = getTranslated(product, 'name', i18n.language);

  useEffect(() => {
    setIsFavorited(product.isFavoritedInitially);
  }, [product.isFavoritedInitially]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("You must be logged in to add or remove favorites.");
      return;
    }

    const endpoint = 'http://localhost:8000/api/favorites.php';
    const payload = { user_id: user.id, service_id: product.id };
    const method = isFavorited ? 'DELETE' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`${displayName} ${isFavorited ? 'removed from' : 'added to'} favorites.`);
        setIsFavorited(!isFavorited);
        onFavoriteToggle?.();
      } else {
        toast.error(result.error || `Failed to update favorites.`);
      }
    } catch (err) {
      toast.error("An error occurred while managing favorites.");
    }
  };

  const isShorter = index % 4 === 0 || index % 4 === 3;

  return (
    <article
      onClick={() => navigate(`/product/${product.id}`)}
      className={`bg-card cursor-pointer rounded-2xl p-3 flex flex-col items-center justify-center relative transition-shadow hover:shadow-lg border border-border/50 ${isShorter ? 'h-[210px]' : 'h-[250px]'}`}
    >
      {/* Favorite heart button - top right */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-10 transition-transform hover:scale-110"
        aria-label={`Toggle ${String(displayName)} as a favorite`}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${isFavorited
              ? 'fill-red-500 text-red-500'
              : 'text-muted-foreground hover:text-red-400'
            }`}
        />
      </button>

      {/* Circular product image */}
      <div className="w-28 h-28 rounded-full overflow-hidden mt-2 mb-3 bg-muted flex-shrink-0">
        <img
          src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:8000/${product.image_url}`}
          className="w-full h-full object-cover"
          alt={String(displayName)}
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />
      </div>

      {/* Product info */}
      <h3 className="text-sm font-semibold text-foreground text-center leading-tight mb-1">
        {String(displayName)}
      </h3>
      <p className="text-golden text-sm font-semibold">
        {t('product.price', { price: product.price })}
      </p>
    </article>
  );
};