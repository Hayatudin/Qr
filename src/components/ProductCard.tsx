import React, { useState, useEffect } from 'react';
import { apiUrl, uploadsUrl } from '@/config/api';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { Product } from '@/types/Product';
import { useNavigate } from 'react-router-dom';

import { useRoomMode } from '@/contexts/RoomContext';
import { Plus } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const { isRoomMode, addToCart } = useRoomMode();
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(product.isFavoritedInitially);
  const [translatedName, setTranslatedName] = useState<string>("");

  const displayName = translatedName || getTranslated(product, 'name', i18n.language);

  useEffect(() => {
    setIsFavorited(product.isFavoritedInitially);
  }, [product.isFavoritedInitially]);

  // Handle Auto-Translation
  useEffect(() => {
    const currentLang = i18n.language;
    const existingTranslation = getTranslated(product, 'name', currentLang);
    
    if (currentLang !== 'en' && !existingTranslation) {
      import('@/utils/translator').then(({ translateAndPersist }) => {
        translateAndPersist(Number(product.id), product.name_en, currentLang, 'name')
          .then(setTranslatedName);
      });
    } else {
      setTranslatedName("");
    }
  }, [i18n.language, product]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("You must be logged in to add or remove favorites.");
      return;
    }

    const endpoint = apiUrl('/favorites.php');
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

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name_en: String(displayName),
      price: product.price,
      image_url: product.image_url,
    });
  };

  const isShorter = index % 4 === 0 || index % 4 === 3;

  return (
    <article
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-card cursor-pointer rounded-2xl flex flex-col relative transition-shadow hover:shadow-lg border border-border/50 overflow-hidden"
    >
      {/* Rectangular product image */}
      <div className={`w-full overflow-hidden relative ${isShorter ? 'h-[130px]' : 'h-[170px]'}`}>
        <img
          src={uploadsUrl(product.image_url)}
          className="w-full h-full object-cover"
          alt={String(displayName)}
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />

        {/* Add Button - top left */}
        {isRoomMode && (
          <button
            onClick={handleAddClick}
            className="absolute top-2.5 left-2.5 z-10 bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
            aria-label="Add to room order"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Favorite heart button - top right with translucent circle */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform hover:scale-110"
          aria-label={`Toggle ${String(displayName)} as a favorite`}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFavorited
              ? 'fill-red-500 text-red-500'
              : 'text-white'
              }`}
          />
        </button>
      </div>

      {/* Product info */}
      <div className="px-3 py-3">
        <h3 className="text-sm font-bold text-foreground leading-tight mb-1 line-clamp-1">
          {String(displayName)}
        </h3>
        <p className="text-foreground text-sm font-bold">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
};