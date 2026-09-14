import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  {
    heading: "Product",
    items: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Assistant", href: "#assistant" },
      { label: "Reports", href: "#reports" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Create account", href: "/signup" },
      { label: "Log in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <BrandLogo linked={false} className="h-7 w-auto md:h-8" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              A personal money manager that makes tracking feel as easy as
              sending a message.
            </p>
            <div className="mt-5">
              <ThemeToggle />
            </div>
          </div>

          {LINKS.map((group) => (
            <div key={group.heading}>
              <p className="text-sm font-bold">{group.heading}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RYVV. All rights reserved.</p>
          <p>Amounts in Indian rupees (₹).</p>
        </div>
      </div>
    </footer>
  );
}
