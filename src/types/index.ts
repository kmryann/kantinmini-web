export interface MenuItemType {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isBestSeller: boolean;
  hasSauceModifier: boolean;
  modifierName?: string | null;
  modifierOptions?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CategoryWithItems {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  menuItems: MenuItemType[];
}

export interface CartItemType {
  cartItemId: string; // Unik berdasarkan menu + saus + catatan
  menuItemId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  sauceOption?: string;
  notes?: string;
}

export type OrderTypeChoice = "DINE_IN" | "TAKEAWAY";
export type PaymentMethodChoice = "QRIS" | "CASH";
export type OrderStatusChoice =
  | "PENDING_PAYMENT"
  | "PROSES"
  | "DIHIDANGKAN"
  | "SELESAI"
  | "VOID";

export interface OrderDetails {
  id: string;
  orderNumber: string;
  tableNumber: number;
  customerName: string;
  orderType: OrderTypeChoice;
  status: OrderStatusChoice;
  paymentMethod: PaymentMethodChoice;
  paymentStatus: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  qrisPayload?: string | null;
  qrisExpiresAt?: string | null;
  cashCode?: string | null;
  cashExpiresAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sauceOption?: string | null;
    notes?: string | null;
  }[];
}

export type OrderModeChoice = "DIRECT" | "WHATSAPP";

export interface StoreSettingType {
  id: string;
  orderMode: OrderModeChoice;
  whatsappNumber: string;
  updatedAt: string;
}
