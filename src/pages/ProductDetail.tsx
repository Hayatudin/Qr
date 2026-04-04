import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { Heart, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { t, i18n } = useTranslation();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const [servicesRes, favoritesRes] = await Promise.all([
          fetch("http://localhost:8000/api/services.php"),
          user ? fetch(`http://localhost:8000/api/favorites.php?user_id=${user.id}`) : Promise.resolve(null)
        ]);

        if (!servicesRes.ok) throw new Error('Failed to fetch services');
        const servicesData = await servicesRes.json();
        const foundProduct = servicesData.find((s: any) => String(s.id) === id);

        if (!foundProduct) {
          throw new Error("Product not found");
        }

        let isFav = false;
        if (favoritesRes && favoritesRes.ok) {
          const favoritesData = await favoritesRes.json();
          if (!favoritesData.error) {
            isFav = favoritesData.some((fav: any) => String(fav.service_id) === id);
          }
        }

        setProduct(foundProduct);
        setIsFavorited(isFav);

      } catch (err: any) {
        toast.error(err.message || "Failed to load product details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductDetails();
  }, [id, user]);

  const handleFavoriteClick = async () => {
    if (!user) {
      toast.error("You must be logged in to manage favorites.");
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
        toast.success(`${getTranslatedName()} ${isFavorited ? 'removed from' : 'added to'} favorites.`);
        setIsFavorited(!isFavorited);
      } else {
        toast.error(result.error || `Failed to update favorites.`);
      }
    } catch (err) {
      toast.error("An error occurred while managing favorites.");
    }
  };

  const getTranslatedName = () => {
    if (!product) return '';
    const lang = i18n.language;
    if (lang === 'am' && product.name_am) return product.name_am;
    if (lang === 'om' && product.name_om) return product.name_om;
    return product.name_en;
  };

  const getTranslatedDescription = () => {
    if (!product) return '';
    const lang = i18n.language;
    if (lang === 'am' && product.description_am) return product.description_am;
    if (lang === 'om' && product.description_om) return product.description_om;
    return product.description_en;
  };

  if (isLoading) {
    return (
      <div className="bg-background flex max-w-[480px] w-full min-h-screen mx-auto items-center justify-center page-transition">
        <p className="text-muted-foreground">{t('messages.loading')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-background flex max-w-[480px] w-full min-h-screen mx-auto flex-col items-center justify-center px-5 page-transition">
        <p className="text-xl font-semibold mb-4 text-foreground">Product not found</p>
        <button onClick={() => navigate(-1)} className="text-golden font-medium underline">Go Back</button>
      </div>
    );
  }

  const imageUrl = product.image_url
    ? (product.image_url.startsWith('http') ? product.image_url : `http://localhost:8000/${product.image_url}`)
    : '/placeholder.svg';

  // Static mock data to perfectly match the UI request
  const ingredients = [
    "Boneless chicken Meats", "Fresh broccoli", "teyrikayi sauce mode",
    "sugar", "garlic", "sesame oil", "salt"
  ];

  const addOns = [
    { name: "Extra Protein 1 scoop", price: "350 ETB" },
    { name: "Extra Mixed Nuts", price: "250 ETB" },
    { name: "Extra Berries", price: "200 ETB" },
  ];

  return (
    <div className="bg-background text-foreground flex max-w-[480px] w-full flex-col overflow-x-hidden mx-auto min-h-screen pb-6 page-transition relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-5 z-20 w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-black"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Hero Section with yellow background and asymmetrical curve */}
      <div className="relative w-full h-[400px] bg-[#EBB41A] rounded-b-[20%] overflow-hidden flex items-center justify-center shadow-lg"
        style={{ borderBottomLeftRadius: '30% 15%', borderBottomRightRadius: '30% 15%', paddingBottom: '40px' }}
      >
        <img
          src={imageUrl}
          alt={getTranslatedName()}
          className="w-64 h-64 object-cover rounded-full drop-shadow-2xl z-10"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />
        {/* Decorative inner curve using a solid element inside or just rely on the main crop for matching design */}
      </div>

      <div className="flex-1 w-full px-6 -mt-10 relative z-10">
        <div className="flex justify-end w-full drop-shadow-sm mb-2">
          <button
            onClick={handleFavoriteClick}
            className="w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-golden"
            aria-label="Toggle favorite"
          >
            <Heart
              className={`w-6 h-6 transition-colors ${isFavorited ? 'fill-golden text-golden' : 'text-golden'
                }`}
              strokeWidth={2.5}
            />
          </button>
        </div>

        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-[#1E2022] dark:text-white w-[60%] leading-tight">{getTranslatedName()}</h1>
          <span className="text-xl font-bold text-golden">{product.price} birr</span>
        </div>

        <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-6 lowercase">
          {getTranslatedDescription() || "this is your food just enjoy it it has chicken leg and its arm filled with bold spicy dulet so just give it a try and i'm sure your'e not gonna disappointed you will like it."}
        </p>

        {/* Ingredients */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-[#1E2022] dark:text-white mb-3">Ingredients:</h2>
          <ul className="space-y-2">
            {ingredients.map((item, index) => (
              <li key={index} className="flex items-center text-sm font-medium text-muted-foreground">
                <Check className="w-4 h-4 mr-2 text-black dark:text-white shrink-0" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Macros */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-[#1E2022] dark:text-white mb-3">Macros:</h2>
          <p className="text-sm font-bold text-[#1E2022] dark:text-white">
            420 kcal <span className="font-medium text-muted-foreground">| p: 34g | F: 40g | C: 58g</span>
          </p>
        </div>

        {/* Add-Ons */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E2022] dark:text-white mb-3">Add-Ons</h2>
          <div className="space-y-2.5">
            {addOns.map((addon, index) => (
              <div key={index} className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center w-full">
                  <Check className="w-4 h-4 mr-2 text-black dark:text-white shrink-0" strokeWidth={3} />
                  <span className="text-muted-foreground whitespace-nowrap">{addon.name}</span>
                  <span className="flex-1 border-b border-dashed border-muted-foreground/30 mx-2 relative top-[2px]"></span>
                  <span className="text-golden font-bold ms-auto">{addon.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate('/feedback')}
          className="w-full bg-black text-white dark:bg-white dark:text-black font-medium text-sm py-4 rounded-[1.5rem] mt-2 mb-6 hover:bg-black/90 dark:hover:bg-white/90 transition-colors"
        >
          Give us feedback
        </button>
      </div>

    </div>
  );
};

export default ProductDetail;
