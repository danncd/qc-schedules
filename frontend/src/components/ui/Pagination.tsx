import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Button from "./Button";
export default function Pagination({
    page,
    total,
    onChange,
}: {
    page: number;
    total: number;
    onChange: (page: number) => void;
}) {
    return (
        <nav
            className="pagination"
            aria-label="Pagination"
        >
            <Button
                className="icon-button"
                disabled={page <= 1}
                aria-label="Previous page"
                onClick={() => onChange(page - 1)}
            >
                <IconChevronLeft
                    size={18}
                    stroke={1.8}
                />
            </Button>
            <span>
                Page {page} of {Math.max(1, total)}
            </span>
            <Button
                className="icon-button"
                disabled={page >= total}
                aria-label="Next page"
                onClick={() => onChange(page + 1)}
            >
                <IconChevronRight
                    size={18}
                    stroke={1.8}
                />
            </Button>
        </nav>
    );
}
