"""Merge TADA Atomberg working sheet and atomberg files by Emp Code."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent
WORKING_FILE = DATA_DIR / "working sheet.xlsx"
ATOMBERG_FILE = DATA_DIR / "atomberg.xlsx"
SHEET_NAME = "TADA Atomberg New"
FINAL_AMOUNT_COL = "Final Amount Payable"
SAMPLE_EMP_CODE = "V5414153"


def normalize_emp_code(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip()


def safe_sum(amount, difference) -> float | None:
    if pd.isna(amount) or pd.isna(difference):
        return None
    try:
        return float(amount) + float(difference)
    except (TypeError, ValueError):
        return None


def load_working(path: Path) -> pd.DataFrame:
    return pd.read_excel(path, sheet_name=SHEET_NAME, engine="openpyxl")


def load_atomberg(path: Path) -> pd.DataFrame:
    return pd.read_excel(path, sheet_name=SHEET_NAME, engine="openpyxl")


def update_working_sheet(working: pd.DataFrame, atomberg: pd.DataFrame) -> pd.DataFrame:
    out = working.copy()
    out["_emp_key"] = normalize_emp_code(out["Emp Code"])

    diff_lookup = (
        atomberg.assign(_emp_key=normalize_emp_code(atomberg["Emp Code"]))
        .set_index("_emp_key")["Difference Amount"]
        .to_dict()
    )

    final_amounts = []
    for _, row in out.iterrows():
        emp_key = row["_emp_key"]
        if emp_key not in diff_lookup:
            final_amounts.append(None)
            continue
        final_amounts.append(safe_sum(row["Amount"], diff_lookup[emp_key]))

    out[FINAL_AMOUNT_COL] = final_amounts
    out[FINAL_AMOUNT_COL] = out[FINAL_AMOUNT_COL].clip(lower=0)
    out = out.drop(columns=["_emp_key"])

    if FINAL_AMOUNT_COL in out.columns:
        cols = list(out.columns)
        cols.remove(FINAL_AMOUNT_COL)
        amount_idx = cols.index("Amount")
        cols.insert(amount_idx + 1, FINAL_AMOUNT_COL)
        out = out[cols]

    return out


def update_atomberg_sheet(working: pd.DataFrame, atomberg: pd.DataFrame) -> pd.DataFrame:
    out = atomberg.copy()
    out["_emp_key"] = normalize_emp_code(out["Emp Code"])

    amount_lookup = (
        working.assign(_emp_key=normalize_emp_code(working["Emp Code"]))
        .set_index("_emp_key")["Amount"]
        .to_dict()
    )

    week2_values = []
    for _, row in out.iterrows():
        emp_key = row["_emp_key"]
        if emp_key not in amount_lookup:
            week2_values.append(None)
            continue
        week2_values.append(safe_sum(amount_lookup[emp_key], row["Difference Amount"]))

    out["Week 2"] = week2_values
    return out.drop(columns=["_emp_key"])


def save_excel(df: pd.DataFrame, path: Path) -> None:
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name=SHEET_NAME, index=False)


def merge_tada(working_path: Path, atomberg_path: Path) -> dict:
    working = load_working(working_path)
    atomberg = load_atomberg(atomberg_path)

    updated_working = update_working_sheet(working, atomberg)
    updated_atomberg = update_atomberg_sheet(working, atomberg)

    save_excel(updated_working, working_path)
    save_excel(updated_atomberg, atomberg_path)

    working_keys = set(normalize_emp_code(working["Emp Code"]))
    atomberg_keys = set(normalize_emp_code(atomberg["Emp Code"]))
    matched_keys = working_keys & atomberg_keys

    working_updated = updated_working[
        normalize_emp_code(updated_working["Emp Code"]).isin(matched_keys)
        & updated_working[FINAL_AMOUNT_COL].notna()
    ]
    atomberg_updated = updated_atomberg[
        normalize_emp_code(updated_atomberg["Emp Code"]).isin(matched_keys)
        & updated_atomberg["Week 2"].notna()
    ]

    sample_working = updated_working[
        normalize_emp_code(updated_working["Emp Code"]) == SAMPLE_EMP_CODE
    ]
    sample_atomberg = updated_atomberg[
        normalize_emp_code(updated_atomberg["Emp Code"]) == SAMPLE_EMP_CODE
    ]

    return {
        "working_rows": len(updated_working),
        "atomberg_rows": len(updated_atomberg),
        "matched_employees": len(matched_keys),
        "working_updated": len(working_updated),
        "atomberg_updated": len(atomberg_updated),
        "working_skipped": len(updated_working) - len(working_updated),
        "atomberg_skipped": len(updated_atomberg) - len(atomberg_updated),
        "sample_working": (
            sample_working[["Emp Code", " Name", "Amount", FINAL_AMOUNT_COL]].iloc[0].to_dict()
            if not sample_working.empty
            else None
        ),
        "sample_atomberg": (
            sample_atomberg[["Emp Code", " Name", "Difference Amount", "Week 2"]].iloc[0].to_dict()
            if not sample_atomberg.empty
            else None
        ),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Merge TADA Atomberg sheets by Emp Code and compute final payable amounts."
    )
    parser.add_argument(
        "--working",
        type=Path,
        default=WORKING_FILE,
        help="Path to working sheet.xlsx",
    )
    parser.add_argument(
        "--atomberg",
        type=Path,
        default=ATOMBERG_FILE,
        help="Path to atomberg.xlsx",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not args.working.exists():
        print(f"Error: working file not found: {args.working}", file=sys.stderr)
        return 1
    if not args.atomberg.exists():
        print(f"Error: atomberg file not found: {args.atomberg}", file=sys.stderr)
        return 1

    summary = merge_tada(args.working, args.atomberg)

    print("TADA merge complete.")
    print(f"  Working sheet rows: {summary['working_rows']}")
    print(f"  Atomberg rows: {summary['atomberg_rows']}")
    print(f"  Matched employees: {summary['matched_employees']}")
    print(f"  Working rows updated: {summary['working_updated']}")
    print(f"  Working rows skipped (no match / invalid): {summary['working_skipped']}")
    print(f"  Atomberg rows updated: {summary['atomberg_updated']}")
    print(f"  Atomberg rows skipped (no match / invalid): {summary['atomberg_skipped']}")

    if summary["sample_working"]:
        print(f"\nSample ({SAMPLE_EMP_CODE}) in working sheet:")
        for key, value in summary["sample_working"].items():
            print(f"  {key}: {value}")
    if summary["sample_atomberg"]:
        print(f"\nSample ({SAMPLE_EMP_CODE}) in atomberg:")
        for key, value in summary["sample_atomberg"].items():
            print(f"  {key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
