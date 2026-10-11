"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
	NavigationMenu,
	NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
}
	from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from 'next-intl';
import { Menu, Globe, ChevronDown } from "lucide-react";
import { setUserLocale } from "@/hooks/useLocale";
import { Locale } from "@/i18n/config";

export default function Navbar() {
	const t = useTranslations();
	const currentLocale = useLocale();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const languages = [
		{ code: "es" as Locale, name: "Español" },
		{ code: "en" as Locale, name: "English" },
		{ code: "ca" as Locale, name: "Català" },
		{ code: "zh" as Locale, name: "中文" },
	];

	const handleLanguageChange = (newLocale: Locale) => {
		startTransition(async () => {
			await setUserLocale(newLocale);
		});
		setIsDropdownOpen(false);
	};

	return (
		<div className="flex justify-between items-center px-4 sm:px-6 py-4 bg-stone-950 border-b border-zinc-800 shadow-lg">
			<h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
				{t("navTitle")}
			</h1>

			<div className="hidden md:flex items-center space-x-6">
				<NavigationMenu className="space-x-6">
					<NavigationMenuLink
						href="/"
						className="text-lg font-medium text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50 transition px-3 py-2 rounded-md"
					>
						{t("navSong")}
					</NavigationMenuLink>
					<NavigationMenuLink
						href="/review"
						className="text-lg font-medium text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50 transition px-3 py-2 rounded-md"
					>
						{t("navReview")}
					</NavigationMenuLink>
					<NavigationMenuLink
						href="/addSong"
						className="text-lg font-medium text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50 transition px-3 py-2 rounded-md"
					>
						{t("navAddSong")}
					</NavigationMenuLink>
				</NavigationMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							disabled={isPending}
							className="bg-zinc-800 text-zinc-50 hover:bg-zinc-700 border-zinc-700 hover:border-zinc-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md shadow-sm disabled:opacity-50"
						>
							<Globe className="w-4 h-4 mr-2 text-zinc-300" />
							{languages.find(lang => lang.code === currentLocale)?.name || "Language"}
							<ChevronDown className="w-4 h-4 ml-2 text-zinc-300" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-[var(--radix-dropdown-menu-trigger-width)] bg-zinc-800 border border-zinc-700 text-zinc-100 shadow-lg rounded-md"
						align="center"
					>
						{languages.map((lang) => (
							<DropdownMenuItem
								key={lang.code}
								onClick={() => handleLanguageChange(lang.code)}
								disabled={isPending}
								className={currentLocale === lang.code ? "bg-zinc-700 text-zinc-50 rounded-sm" : "hover:bg-zinc-700 hover:text-zinc-50 rounded-sm"}
							>
								{lang.name}
								{isPending && currentLocale === lang.code && " (switching...)"}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="md:hidden">
				<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-100 hover:bg-zinc-800 rounded-md"
						>
							<Menu className="h-6 w-6" />
						</Button>
					</SheetTrigger>
					<SheetContent side="right"
						className="w-80 bg-zinc-900 border-zinc-800 text-zinc-100"
					>
						<SheetHeader>
							<SheetTitle className="text-zinc-100">{t("navTitle")}</SheetTitle>
							<SheetDescription className="text-zinc-400">
								{t("navDescription")}
							</SheetDescription>
						</SheetHeader>

						<div className="flex flex-col space-y-4 mt-6">
							<div className="space-y-2">
								<Button
									variant="ghost"
									className="w-full justify-start text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50 rounded-md"
									asChild
								>
									<Link href="/" onClick={() => setIsSheetOpen(false)}>
										{t("navSong")}
									</Link>
								</Button>
								<Button
									variant="ghost"
									className="w-full justify-start text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50 rounded-md"
									asChild
								>
									<Link href="/review" onClick={() => setIsSheetOpen(false)}>
										{t("navReview")}
									</Link>
								</Button>
							</div>

							<div className="pt-4 border-t border-zinc-800 px-4">
								<h3 className="text-sm font-medium text-zinc-400 mb-3">
									{t("navLanguage")}
								</h3>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											disabled={isPending}
											className="w-full justify-between bg-zinc-800 text-zinc-50 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md shadow-sm disabled:opacity-50"
										>
											<div className="flex items-center">
												<Globe className="w-4 h-4 mr-2 text-zinc-300" />
												{languages.find(lang => lang.code === currentLocale)?.name || "Language"}
											</div>
											<ChevronDown className="w-4 h-4 text-zinc-300" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										className="min-w-[var(--radix-dropdown-menu-trigger-width)] bg-zinc-800 border border-zinc-700 text-zinc-100 shadow-lg rounded-md"
										align="center"
									>
										{languages.map((lang) => (
											<DropdownMenuItem
												key={lang.code}
												onClick={() => handleLanguageChange(lang.code)}
												disabled={isPending}
												className={currentLocale === lang.code ? "bg-zinc-700 text-zinc-50 rounded-sm" : "hover:bg-zinc-700 hover:text-zinc-50 rounded-sm"}
											>
												{lang.name}
												{isPending && " (switching...)"}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	);
}