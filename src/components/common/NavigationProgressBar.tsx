"use client";

import React from "react";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function NavigationProgressBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ProgressBar
        height="3px"
        color="#119977"
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
