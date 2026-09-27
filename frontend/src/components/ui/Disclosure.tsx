"use client";
import { IconChevronDown } from "@tabler/icons-react";
import { useId, useState, type ReactNode } from "react";
export default function Disclosure({
    title,
    children,
    open: controlled,
    onToggle,
    defaultOpen = false,
    chevron = false,
    labels = ["Open Stats", "Close Stats"],
}: {
    title: ReactNode;
    children: ReactNode;
    open?: boolean;
    onToggle?: () => void;
    defaultOpen?: boolean;
    chevron?: boolean;
    labels?: [string, string];
}) {
    const [local, setLocal] = useState(defaultOpen);
    const open = controlled ?? local;
    const id = useId();
    return (
        <div className="disclosure">
            <button
                className="disclosure-trigger"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => (onToggle ? onToggle() : setLocal(!local))}
            >
                <span>{title}</span>
                {chevron ? (
                    <IconChevronDown
                        className={`disclosure-chevron ${open ? "is-open" : ""}`}
                        size={18}
                        stroke={1.6}
                        aria-hidden="true"
                    />
                ) : (
                    <span className="small-button">{labels[open ? 1 : 0]}</span>
                )}
            </button>
            <div
                className="disclosure-content"
                data-open={open}
                aria-hidden={!open}
                inert={!open}
                id={id}
            >
                <div>
                    <div className="disclosure-inner">{children}</div>
                </div>
            </div>
        </div>
    );
}
