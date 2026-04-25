import Button from "@/components/ui/Button";
import { IconSearch } from "@tabler/icons-react";

interface SearchBarProps {
	semesters: string[];
	value: string;
	selected: string;
	onChange: (val: string) => void;
	onSelect: (val: string) => void;
	onSelectNew: () => void;
	isNewSelected: boolean;
}

export default function SearchBar({
	semesters,
	value,
	onChange,
	selected,
	onSelect,
	onSelectNew,
	isNewSelected
}: SearchBarProps) {
	return (
		<div className="w-full flex flex-col flex-items gap-3">
			<div className="shadow-md bg-white dark:bg-[#212121] p-2 rounded-lg border border-gray-500 flex items-center gap-2">
				<IconSearch
					size={20}
					className="text-gray-500 dark:text-gray-300 mx-0.5"
				/>
				<input
					placeholder="Enter course name, description or instructor name..."
					className="w-full bg-transparent outline-none text-black dark:text-gray-300"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			</div>
			<div className="flex flex-row gap-3 items-center">
				{semesters.map((sem) => (
					<Button
						key={sem}
						className={`${selected === sem ? "dark:bg-purple-900! dark:text-gray-100" : "bg-gray-200! text-gray-900"} py-1!`}
						onClick={() => onSelect(sem)}
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
					className={`py-1! ${
						isNewSelected
							? "dark:bg-red-600! bg-red-500! dark:text-white"
							: "bg-gray-200! text-gray-900"
					}`}
				>
					New
				</Button>
			</div>
		</div>
	);
}
