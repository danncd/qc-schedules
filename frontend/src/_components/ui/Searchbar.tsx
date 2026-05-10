import { IconSearch, IconX } from "@tabler/icons-react";
import Button from "./Button";

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
			<div className="shadow-md bg-white dark:bg-[#212121] p-2 rounded-lg border border-gray-500 flex items-center gap-2">
				<IconSearch
					size={20}
					className="text-gray-500 dark:text-gray-300 mx-0.5"
				/>
				<input
					placeholder={placeholder}
					className="w-full bg-transparent outline-none text-black dark:text-gray-300"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			</div>
			{courseSearchbar && semesters && (
				<div className="flex flex-row flex-wrap gap-3 items-center">
					{semesters.map((sem) => (
						<Button
							key={sem}
							className={`${selectedSem === sem ? "dark:bg-purple-700! dark:text-gray-100" : "bg-gray-200! text-gray-900"}`}
							onClick={() => onSelect?.(sem)}
						>
							{sem}
						</Button>
					))}
                    <div
                        className="h-5 w-0.5 bg-gray-400"
                        aria-hidden="true"
                    />
                    <Button
                        onClick={onSelectNew}
                        className={`flex items-center ${
                            isNewSelected
                                ? "dark:bg-red-600! bg-red-500! dark:text-white"
                                : "bg-gray-200! text-gray-900"
                        }`}
                    >
                        New{isNewSelected && <IconX size={15} className="ml-2"/>}
                    </Button>
				</div>
			)}
		</div>
	);
}
