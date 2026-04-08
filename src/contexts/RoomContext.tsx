import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { notifyAdmin } from '@/lib/firebase';

interface CartItem {
  id: number;
  name_en: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface RoomContextType {
  isRoomMode: boolean;
  roomNumber: string | null;
  cart: CartItem[];
  addToCart: (item: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<void>;
  callWaiter: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams();
  const [isRoomMode, setIsRoomMode] = useState(false);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const room = searchParams.get('room');

    if (mode === 'room' && room) {
      setIsRoomMode(true);
      setRoomNumber(room);
      sessionStorage.setItem('room_service_mode', 'true');
      sessionStorage.setItem('room_number', room);
    } else {
      const savedMode = sessionStorage.getItem('room_service_mode');
      const savedRoom = sessionStorage.getItem('room_number');
      if (savedMode === 'true' && savedRoom) {
        setIsRoomMode(true);
        setRoomNumber(savedRoom);
      }
    }
  }, [searchParams]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name_en} added to order`);
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setCart([]);

  const placeOrder = async () => {
    if (!roomNumber || cart.length === 0) return;

    try {
      const response = await fetch('http://localhost:8000/api/orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber,
          items: cart,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Order placed successfully!');
        
        // Notify admin in real-time
        notifyAdmin('order', { 
          roomNumber, 
          orderId: result.order_id,
          totalPrice: cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
        });
        
        clearCart();
      } else {
        toast.error(result.error || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Error connecting to server');
    }
  };

  const callWaiter = async () => {
    if (!roomNumber) return;

    try {
      const response = await fetch('http://localhost:8000/api/calls.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Waiter called. Someone will be with you shortly.');
        
        // Notify admin in real-time
        notifyAdmin('call', { roomNumber, callId: result.call_id });
      } else {
        toast.error(result.error || 'Failed to call waiter');
      }
    } catch (error) {
      toast.error('Error connecting to server');
    }
  };

  return (
    <RoomContext.Provider
      value={{
        isRoomMode,
        roomNumber,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        placeOrder,
        callWaiter,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomMode = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomMode must be used within a RoomProvider');
  }
  return context;
};
