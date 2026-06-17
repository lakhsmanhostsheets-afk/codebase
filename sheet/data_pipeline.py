"""Load, merge, and compare AO Smith ops master vs billing sheets."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent
OPS_FILE = DATA_DIR / "Associate Ops Master Report171552.xlsx"
BILLING_FILE = DATA_DIR / "Billing Sheet-Ao Smith-May-26-25 Emp.xls"

EMPLOYEE_ID_PATTERN = r"^V\d+"
SALARY_TOLERANCE = 100


def load_ops_master() -> pd.DataFrame:
    df = pd.read_excel(OPS_FILE, sheet_name="Grid", engine="openpyxl")
    df["EmployeeId"] = df["EmployeeId"].astype(str).str.strip()
    return df


def load_billing() -> pd.DataFrame:
    df = pd.read_excel(BILLING_FILE, sheet_name="Sheet1", engine="xlrd")
    df["EmployeeNo"] = df["EmployeeNo"].astype(str).str.strip()
    return df[df["EmployeeNo"].str.match(EMPLOYEE_ID_PATTERN, na=False)].copy()


def merge_datasets(ops: pd.DataFrame, billing: pd.DataFrame) -> pd.DataFrame:
    merged = ops.merge(
        billing,
        left_on="EmployeeId",
        right_on="EmployeeNo",
        how="outer",
        indicator=True,
        suffixes=("_ops", "_bill"),
    )
    merged["merge_status"] = merged["_merge"].map(
        {
            "both": "Matched",
            "left_only": "Ops only",
            "right_only": "Billing only",
        }
    )
    return merged.drop(columns=["_merge"])


def add_comparisons(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    matched = out["merge_status"] == "Matched"

    out["gross_diff"] = pd.NA
    out["net_diff"] = pd.NA
    out["ctc_diff"] = pd.NA
    out.loc[matched, "gross_diff"] = out.loc[matched, "Gross"] - out.loc[matched, "GROSS"]
    out.loc[matched, "net_diff"] = out.loc[matched, "Net"] - out.loc[matched, "NET PAY"]
    out.loc[matched, "ctc_diff"] = out.loc[matched, "CTC"] - out.loc[matched, "Full CTC"]

    out["gross_match"] = out["gross_diff"].abs() <= SALARY_TOLERANCE
    out["net_match"] = out["net_diff"].abs() <= SALARY_TOLERANCE
    out["ctc_match"] = out["ctc_diff"].abs() <= SALARY_TOLERANCE
    out["salary_flag"] = "—"
    out.loc[matched & out["gross_match"] & out["net_match"] & out["ctc_match"], "salary_flag"] = "OK"
    out.loc[matched & (out["salary_flag"] != "OK"), "salary_flag"] = "Mismatch"

    out["display_name"] = out["CandidateName"].fillna(out["Name"])
    out["display_designation"] = out["Designation_ops"].fillna(out["Designation_bill"])
    out["display_state"] = out["WorklocationState"].fillna(out["State"])
    out["display_location"] = out["WorkLocation"].fillna(out["Location"])
    return out


def load_merged() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    ops = load_ops_master()
    billing = load_billing()
    merged = add_comparisons(merge_datasets(ops, billing))
    return ops, billing, merged


def summary_metrics(merged: pd.DataFrame) -> dict:
    matched = merged[merged["merge_status"] == "Matched"]
    mismatches = matched[matched["salary_flag"] == "Mismatch"]
    billing_slice = matched.dropna(subset=["Grand Total"])

    return {
        "ops_count": int((merged["merge_status"] != "Billing only").sum()),
        "billing_count": int((merged["merge_status"] != "Ops only").sum()),
        "matched": len(matched),
        "ops_only": int((merged["merge_status"] == "Ops only").sum()),
        "billing_only": int((merged["merge_status"] == "Billing only").sum()),
        "salary_mismatches": len(mismatches),
        "total_net_pay": float(billing_slice["NET PAY"].sum()),
        "total_grand_total": float(billing_slice["Grand Total"].sum()),
        "avg_ctc": float(matched["CTC"].mean()) if len(matched) else 0.0,
    }
