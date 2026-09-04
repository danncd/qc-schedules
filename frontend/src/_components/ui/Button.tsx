import { ReactNode } from "react";

type ButtonProps = {
	children: ReactNode;
	variant?: "Ghost" | "Normal" | "Destructive" | "Outline" | "Secondary";
	className?: string;
	disabled?: boolean;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
};

export default function Button({
	children,
	variant,
	className,
	disabled,
    onClick,
	...props
}: ButtonProps) {
	const variantClasses: Record<string, string> = {
		Ghost: "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white",
		Destructive: "text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-500 shadow-xs",
		Outline:
			"border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 dark:hover:text-white shadow-xs",
		Normal: "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-xs",
		Secondary: "bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 dark:hover:text-white border border-neutral-200/70 dark:border-neutral-700/70 shadow-2xs",
	};

	const appliedVariant = variant
		? variantClasses[variant]
		: variantClasses.Normal;

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`w-fit px-3.5 py-1.5 rounded-full text-sm font-medium ${appliedVariant} active:scale-[0.98]
				${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} 
				${className || ""}`}
			{...props}
		>
			{children}
		</button>
	);
}
