import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:product',
      );

      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const productIndex = products.findIndex(prdct => prdct.id === id);

      if (productIndex > -1) {
        newProducts[productIndex].quantity += 1;

        setProducts(newProducts);
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace:product',
        JSON.stringify([...products, newProducts]),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let newProducts = [...products];
      const productIndex = products.findIndex(prdct => prdct.id === id);

      if (productIndex > -1) {
        if (products[productIndex].quantity === 1) {
          newProducts = products.filter(product => product.id !== id);

          setProducts(newProducts);
        } else {
          newProducts[productIndex].quantity -= 1;

          setProducts(newProducts);
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify([...products, newProducts]),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const storedProducts = products.findIndex(
        prdct => prdct.id === product.id,
      );

      if (storedProducts === -1) {
        setProducts([...products, { ...product, quantity: 1 }]);

        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
