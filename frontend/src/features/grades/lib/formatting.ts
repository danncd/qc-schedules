export function metric(value: number | null, suffix = "", digits = 1) {
    return value === null
        ? "Unavailable"
        : `${value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: suffix ? 0 : digits })}${suffix}`;
}
