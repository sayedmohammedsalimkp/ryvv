"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, TopNav, MobileBrandBar } from "@/components/layout/app-nav";
import { BrandLogo } from "@/components/brand/brand-logo";
import { useAuthStore } from "@/store/useAuthStore";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <BrandLogo priority className="h-8 w-auto animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading your money…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopNav />
      <MobileBrandBar />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 pb-28 pt-8 sm:px-8 md:pb-16 lg:px-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
