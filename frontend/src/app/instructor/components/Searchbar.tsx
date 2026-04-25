import { IconSearch } from "@tabler/icons-react";


interface SearchBarProps {
    value: string;
	onChange: (val: string) => void;
}


export default function SearchBar({ value, onChange}: SearchBarProps) {
	return (
		<div>
			<div className="shadow-md bg-white dark:bg-[#212121] p-2 rounded-lg border border-gray-500 flex items-center gap-2">
				<IconSearch
					size={20}
					className="text-gray-500 dark:text-gray-300 mx-0.5"
				/>
				<input
					placeholder="Search instructor name (e.g. Doe, J)..."
					className="w-full bg-transparent outline-none text-black dark:text-gray-300"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			</div>
		</div>
	);
}
