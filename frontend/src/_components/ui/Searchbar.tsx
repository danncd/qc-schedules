import { IconSearch, IconX } from "@tabler/icons-react";
import Button from "./Button";
import { manrope } from "@/_lib/fonts";

type Props = {
	courseSearchbar?: boolean;
	instructorSearchbar?: boolean;
	value: string;
    selectedSem?: string;

	onChange: (val: string) => void;
	onSelect?: (val: string) => void;
	onSelectNew?: () => void;
	isNewSelected?: boolean;
	semesters?: string[];
};

export default function Searchbar({
	courseSearchbar,
	instructorSearchbar,
	value,
    selectedSem,

	onChange,
	onSelect,
	onSelectNew,

	isNewSelected,
	semesters,
}: Props) {
	const placeholder = courseSearchbar
		? "Enter course name, description or instructor name..."
		: "Search instructor name (e.g. Doe, J)...";

	return (
		<div className="flex flex-col gap-3 pt-2">
			<div className="shadow-xs bg-white dark:bg-[#1c1c1e] px-3.5 py-2.5 rounded-full border border-neutral-300/80 dark:border-neutral-700/80 flex items-center gap-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/80">
				<IconSearch
					size={17}
					className="text-neutral-600 dark:text-neutral-400 shrink-0"
				/>
				<input
					placeholder={placeholder}
					className="w-full bg-transparent outline-none text-base md:text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			</div>
			{courseSearchbar && semesters && (
				<div className="flex flex-row flex-wrap gap-2 items-center pt-1">
					{semesters.map((sem) => {
						const isSelected = selectedSem === sem;
						return (
							<Button
								key={sem}
								variant={isSelected ? "Normal" : "Secondary"}
								className={`${manrope.className} font-bold text-xs px-3.5 py-1.5`}
								onClick={() => onSelect?.(sem)}
							>
								{sem}
							</Button>
						);
					})}
                    <div
                        className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1"
                        aria-hidden="true"
                    />
                    <Button
                        onClick={onSelectNew}
                        variant={isNewSelected ? "Destructive" : "Secondary"}
                        className={`${manrope.className} flex items-center text-xs px-3.5 py-1.5 font-bold`}
                    >
                        New{isNewSelected && <IconX size={14} className="ml-1.5"/>}
                    </Button>
				</div>
			)}
		</div>
	);
}
