import { IconSearch } from "@tabler/icons-react";
export default function SearchInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <label className="search">
            <IconSearch
                size={17}
                stroke={1.6}
                aria-hidden="true"
            />
            <input
                type="search"
                aria-label={placeholder}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    );
}
