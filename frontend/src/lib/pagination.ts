export function pageNumber(value: string | null, total: number, pageSize = 50) {
    const number = Number(value);
    return Math.min(
        Math.max(1, Math.ceil(total / pageSize)),
        Number.isInteger(number) && number > 0 ? number : 1,
    );
}
