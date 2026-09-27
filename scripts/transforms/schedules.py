import pandas as pd


def normalize_schedule(rows: pd.DataFrame) -> pd.DataFrame:
    result = rows.dropna(how="all").dropna(how="all", axis=1).copy()
    result = result.loc[:, ~result.columns.astype(str).str.contains(r"^Unnamed|^0\.0$")]
    required = {"Code", "Sec", "Course (hr, crd)", "Description"}
    missing = required - set(result.columns)
    if missing:
        raise ValueError(f"Schedule is missing columns: {', '.join(sorted(missing))}")
    for column in ("Code", "Sec"):
        result[column] = (
            result[column]
            .astype("string")
            .str.strip()
            .str.replace(r"^(\d+)\.0$", r"\1", regex=True)
        )
        if result[column].isna().any() or result[column].eq("").any():
            raise ValueError(f"Schedule contains a missing {column}.")
    return result.drop_duplicates().reset_index(drop=True)
