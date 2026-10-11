"use client"

import { ReactNode } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from 'next-intl';
import { matchesSong, normalizeSearch, type SongListItem } from "@/lib/songSearch"

interface SongListProps {
	songs: SongListItem[]
	searchTerm: string
	onSearchChange: (value: string) => void
	selectedSong: string | null
	onSongSelect: (title: string) => void
	headerContent?: ReactNode
	isMobile?: boolean
}

export default function SongList({
	songs,
	searchTerm,
	onSearchChange,
	selectedSong,
	onSongSelect,
	headerContent,
	isMobile = false
}: SongListProps) {
	const t = useTranslations()

	// busca por caracteres, pinyin ("yesu") o iniciales ("yslw")
	const query = normalizeSearch(searchTerm)
	const filteredSongs = songs.filter(song => matchesSong(song, query))

	const headerClass = isMobile ? "p-4" : "p-6"
	const contentClass = isMobile ? "p-4" : "p-6"

	return (
		<>
			{/* Header with search and additional content */}
			<div className={`border-b border-border shrink-0 space-y-3 ${headerClass}`}>
				<Input
					type="text"
					placeholder={t("searchPlaceholder")}
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full"
				/>
				{headerContent}
			</div>

			{/* Song list */}
			<div className="flex-1 min-h-0">
				<ScrollArea className="h-full">
					<motion.div
						className={`space-y-2 ${contentClass}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.4 }}
					>
						<AnimatePresence>
							{filteredSongs.map(({ name: title }) => (
								<motion.div
									key={title}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
									whileHover={!isMobile ? { scale: 1.02 } : undefined}
									whileTap={!isMobile ? { scale: 0.98 } : undefined}
								>
									<Button
										variant={selectedSong === title ? "default" : "ghost"}
										className={`w-full justify-start h-auto p-4 text-left font-normal border ${selectedSong === title
											? "border-primary"
											: "border-border hover:bg-accent hover:border-accent-foreground/20"
											}`}
										onClick={() => onSongSelect(title)}
									>
										<div className={isMobile ? "font-medium" : ""}>
											{title}
										</div>
									</Button>
								</motion.div>
							))}
						</AnimatePresence>
						{filteredSongs.length === 0 && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className={`text-muted-foreground text-center ${isMobile ? "px-4 py-8" : "px-4 py-3"
									}`}
							>
								{t("noSongsFound")}
							</motion.div>
						)}
					</motion.div>
				</ScrollArea>
			</div>
		</>
	)
}