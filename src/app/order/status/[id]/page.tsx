import React from "react";
import StatusClient from "./StatusClient";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StatusClient orderId={id} />;
}
