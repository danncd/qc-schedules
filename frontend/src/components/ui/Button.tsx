import { ReactNode } from "react";

type ButtonProps = {
	children: ReactNode;
	variant?: "Ghost" | "Normal" | "Destructive" | "Outline";
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
		Ghost: "text-[#212121] dark:text-[#F1F1F1] hover:bg-black/8 dark:hover:bg-white/10",
		Destructive: "text-red-700 bg-red-300/90",
		Outline:
			"border border-gray-400 hover:bg-gray-200 text-[#212121] dark:border-[#F1F1F1] dark:text-[#F1F1F1] dark:hover:bg-[#282828]",
		Normal: "bg-[#212121] text-[#F1F1F1] dark:text-[#212121] dark:bg-gray-100",
	};

	const appliedVariant = variant
		? variantClasses[variant]
		: variantClasses.Normal;

	return (
		<button
            onClick={onClick}
			disabled={disabled}
			className={`w-fit px-3 py-1.5 rounded-lg ${appliedVariant} 
                transition-all ease-in-out duration-200
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
                ${className || ""}`}
		>
			{children}
		</button>
	);
}
