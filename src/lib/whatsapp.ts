import { CartItemType, OrderTypeChoice } from "@/types";

/**
 * Normalisasi nomor HP ke format internasional WhatsApp (628xxx)
 */
export function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("62")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  return "62" + digits;
}

interface GenerateWhatsAppMessageOptions {
  customerName: string;
  orderType: OrderTypeChoice;
  tableNumber?: number | null;
  cart: CartItemType[];
  subtotal: number;
  orderMode?: "DIRECT" | "WHATSAPP";
}

/**
 * Format teks pesanan ke WhatsApp dengan rapi dan ramah
 */
export function generateWhatsAppOrderMessage({
  customerName,
  orderType,
  tableNumber,
  cart,
  subtotal,
  orderMode = "WHATSAPP",
}: GenerateWhatsAppMessageOptions): string {
  const tipeText = orderType === "DINE_IN" ? "Makan di Tempat (Dine In)" : "Bungkus (Takeaway)";
  const mejaText = orderMode === "DIRECT" && tableNumber ? `\n*Meja:* ${tableNumber}` : "";

  let itemsText = "";
  cart.forEach((item, index) => {
    const itemTotal = (item.price * item.quantity).toLocaleString("id-ID");
    itemsText += `${index + 1}. *${item.name}* (${item.quantity}x) = Rp ${itemTotal}\n`;
    if (item.sauceOption) {
      itemsText += `   - Varian/Saus: ${item.sauceOption}\n`;
    }
    if (item.notes) {
      itemsText += `   - Catatan: _${item.notes}_\n`;
    }
  });

  const totalText = `Rp ${subtotal.toLocaleString("id-ID")}`;

  const message = `Halo Kantin Mini! 👋
Saya ingin memesan menu berikut:

*Nama Pemesan:* ${customerName.trim() || "-"}
*Tipe Pesanan:* ${tipeText}${mejaText}

*Rincian Pesanan:*
${itemsText.trim()}

*Total Pembayaran:* ${totalText}

Mohon konfirmasi ketersediaan dan total pembayarannya ya. Terima kasih! 🙏`;

  return message;
}

/**
 * Buat URL link WhatsApp siap klik
 */
export function createWhatsAppOrderLink(
  whatsappNumber: string,
  options: GenerateWhatsAppMessageOptions
): string {
  const cleanPhone = formatWhatsAppNumber(whatsappNumber);
  const text = generateWhatsAppOrderMessage(options);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
