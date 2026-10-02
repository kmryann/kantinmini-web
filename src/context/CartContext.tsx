"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItemType, OrderTypeChoice } from "@/types";

interface CartContextType {
  cart: CartItemType[];
  totalItems: number;
  subtotal: number;
  customerName: string;
  orderType: OrderTypeChoice;
  tableNumber: number;
  setCustomerName: (name: string) => void;
  setOrderType: (type: OrderTypeChoice) => void;
  setTableNumber: (table: number) => void;
  addToCart: (
    item: {
      id: string;
      name: string;
      price: number;
      imageUrl: string;
    },
    quantity?: number,
    sauceOption?: string,
    notes?: string
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  updateNotes: (cartItemId: string, notes: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItemType[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedCart = localStorage.getItem("kantinmini_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("kantinmini_customer_name") || "";
    } catch {
      return "";
    }
  });
  const [orderType, setOrderType] = useState<OrderTypeChoice>("DINE_IN");
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("kantinmini_cart", JSON.stringify(cart));
      if (customerName) {
        localStorage.setItem("kantinmini_customer_name", customerName);
      }
    } catch {
      // ignore
    }
  }, [cart, customerName]);

  const addToCart = (
    item: { id: string; name: string; price: number; imageUrl: string },
    quantity = 1,
    sauceOption?: string,
    notes?: string
  ) => {
    const cleanNotes = notes?.trim() || undefined;
    const cleanSauce = sauceOption || undefined;
    const cartItemId = `${item.id}_${cleanSauce || "none"}_${cleanNotes || "none"}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (ci) => ci.cartItemId === cartItemId
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            cartItemId,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            quantity,
            sauceOption: cleanSauce,
            notes: cleanNotes,
          },
        ];
      }
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItemType[];
    });
  };

  const updateNotes = (cartItemId: string, notes: string) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.cartItemId === cartItemId) {
          return { ...item, notes: notes.trim() };
        }
        return item;
      });
    });
  };

  const removeItem = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem("kantinmini_cart");
    } catch {
      // ignore
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        subtotal,
        customerName,
        orderType,
        tableNumber,
        setCustomerName,
        setOrderType,
        setTableNumber,
        addToCart,
        updateQuantity,
        updateNotes,
        removeItem,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
