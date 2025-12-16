"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">
              Battleship AI
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/" ? "text-foreground" : "text-foreground/60",
              )}
            >
              Game
            </Link>
            <Link
              href="/ranking"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/ranking"
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              Ranking
            </Link>
          </nav>
        </div>
      </div>
    </nav>
  );
}
