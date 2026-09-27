import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { Term } from "@/lib/terms";
export default function ScheduleToolbar({
    query,
    onQuery,
    term,
    terms,
    onTerm,
    onlyNew,
    onNew,
}: {
    query: string;
    onQuery: (q: string) => void;
    term: string;
    terms: Term[];
    onTerm: (term: string) => void;
    onlyNew: boolean;
    onNew: () => void;
}) {
    return (
        <div className="toolbar">
            <SearchInput
                value={query}
                onChange={onQuery}
                placeholder="Search a course, instructor, room, or class code"
            />
            <Select
                label="Semester"
                value={term}
                options={terms.map((term) => ({
                    value: term.id,
                    label: term.label,
                }))}
                onChange={onTerm}
            />
            <Button
                className="new-filter"
                aria-pressed={onlyNew}
                onClick={onNew}
            >
                Newly added
            </Button>
        </div>
    );
}
