"use client";
import { useId, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
export default function Select({
    value,
    options,
    onChange,
    label,
    disabled = false,
}: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    label: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const id = useId();
    function focus(index: number) {
        requestAnimationFrame(() =>
            root.current
                ?.querySelectorAll<HTMLButtonElement>('[role="option"]')
                [index]?.focus(),
        );
    }
    return (
        <div
            className="select"
            ref={root}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                    setOpen(false);
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    setOpen(false);
                    trigger.current?.focus();
                }
                if (
                    ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
                ) {
                    event.preventDefault();
                    setOpen(true);
                    const elements = Array.from(
                        root.current?.querySelectorAll('[role="option"]') || [],
                    );
                    const index = elements.indexOf(document.activeElement!);
                    focus(
                        event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? options.length - 1
                              : index < 0
                                ? event.key === "ArrowDown"
                                    ? 0
                                    : options.length - 1
                                : (index +
                                      (event.key === "ArrowDown" ? 1 : -1) +
                                      options.length) %
                                  options.length,
                    );
                }
            }}
        >
            <button
                className="button select-trigger"
                ref={trigger}
                disabled={disabled}
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => {
                    setOpen(!open);
                    if (!open)
                        focus(
                            Math.max(
                                0,
                                options.findIndex(
                                    (option) => option.value === value,
                                ),
                            ),
                        );
                }}
            >
                {options.find((option) => option.value === value)?.label ||
                    label}
                <IconChevronDown
                    size={16}
                    stroke={1.6}
                    aria-hidden="true"
                />
            </button>
            {open && (
                <>
                    <div
                        className="select-dismiss"
                        onPointerDown={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        className="select-menu"
                        id={id}
                        role="listbox"
                        aria-label={label}
                    >
                        {options.map((option) => (
                            <button
                                role="option"
                                aria-selected={option.value === value}
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                    trigger.current?.focus();
                                }}
                            >
                                {option.label}
                                {option.value === value && (
                                    <IconCheck
                                        size={14}
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
