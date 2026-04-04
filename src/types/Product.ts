// This interface defines the shape of a single service/product.
// By keeping it in its own file, we avoid circular dependencies.

export interface Product {
  id: string;
  name_en: string;
  name_am: string;
  name_om: string;
  description_en: string;
  description_am: string;
  description_om: string;
  price: string;
  rating: number;
  reviewCount: string;
  image: string;
  image_url: string;
  type: string;
  isFavoritedInitially: boolean;
}
