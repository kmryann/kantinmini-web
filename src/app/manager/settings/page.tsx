import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/admin/SettingsClient";
import { StoreSettingType } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Mode Toko | Manager Kantin Mini",
};

export default async function ManagerSettingsPage() {
  const session = await getAdminSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    redirect("/login");
  }

  let setting = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });

  if (!setting) {
    setting = await prisma.storeSetting.create({
      data: {
        id: "default",
        orderMode: "WHATSAPP",
        whatsappNumber: "085117693117",
      },
    });
  }

  const settingData: StoreSettingType = {
    id: setting.id,
    orderMode: (setting.orderMode as "DIRECT" | "WHATSAPP") || "WHATSAPP",
    whatsappNumber: setting.whatsappNumber,
    updatedAt: setting.updatedAt.toISOString(),
  };

  return <SettingsClient initialSetting={settingData} role="MANAGER" />;
}
