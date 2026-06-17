"""Attrition metrics from ops master and monthly billing exports."""

from __future__ import annotations

import re
from typing import Any

import pandas as pd

MONTH_MAP = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}


def _to_datetime(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce")


def parse_billing_period(billing: pd.DataFrame) -> pd.Period | None:
    """Read billing month from ``Salary Processed Month`` (e.g. ``May-2026 (31.00)``)."""
    if "Salary Processed Month" not in billing.columns:
        return None
    values = billing["Salary Processed Month"].dropna().astype(str)
    if values.empty:
        return None
    match = re.search(r"([A-Za-z]{3,})-(\d{4})", values.iloc[0])
    if not match:
        return None
    month_num = MONTH_MAP.get(match.group(1).lower()[:3])
    if not month_num:
        return None
    return pd.Period(year=int(match.group(2)), month=month_num, freq="M")


def prepare_billing_dates(billing: pd.DataFrame) -> pd.DataFrame:
    out = billing.copy()
    out["leave_date"] = _to_datetime(out.get("Date of Leaving"))
    out["join_date"] = _to_datetime(out.get("Date of Joining"))
    return out


def leavers_in_period(billing: pd.DataFrame, period: pd.Period) -> pd.DataFrame:
    df = prepare_billing_dates(billing)
    mask = df["leave_date"].notna() & (df["leave_date"].dt.to_period("M") == period)
    return df.loc[mask].copy()


def active_headcount(billing: pd.DataFrame, period: pd.Period) -> int:
    """Employees on the billing roster for the period (payroll run)."""
    return len(prepare_billing_dates(billing))


def monthly_attrition_rate(leavers: int, headcount: int) -> float | None:
    if headcount <= 0:
        return None
    return round(100.0 * leavers / headcount, 2)


def enrich_leavers(leavers: pd.DataFrame, merged: pd.DataFrame) -> pd.DataFrame:
    if leavers.empty:
        return leavers

    ops_cols = [
        "EmployeeId",
        "CandidateName",
        "Email",
        "Mobile",
        "WorkLocation",
        "WorklocationState",
        "Designation_ops",
        "EmpStatusName",
        "DateofJoining",
        "CTC",
        "Gross",
        "Net",
    ]
    ops_lookup = merged[merged["merge_status"].isin(["Matched", "Ops only"])][
        [c for c in ops_cols if c in merged.columns]
    ].drop_duplicates(subset=["EmployeeId"])

    detail = leavers.merge(
        ops_lookup,
        left_on="EmployeeNo",
        right_on="EmployeeId",
        how="left",
    )
    detail["tenure_days"] = (detail["leave_date"] - detail["join_date"]).dt.days
    detail["display_name"] = detail["Name"].fillna(detail.get("CandidateName"))
    return detail


def leaver_display_table(detail: pd.DataFrame) -> pd.DataFrame:
    columns = {
        "EmployeeNo": "Employee ID",
        "display_name": "Name",
        "leave_date": "Date of leaving",
        "join_date": "Date of joining",
        "tenure_days": "Tenure (days)",
        "Designation": "Designation (billing)",
        "Location": "Location",
        "State": "State",
        "EmpStatusName": "Ops status",
        "Email": "Email",
        "Mobile": "Mobile",
        "CTC": "Ops CTC",
        "NET PAY": "Last net pay",
        "Grand Total": "Last grand total",
    }
    present = [src for src in columns if src in detail.columns]
    out = detail[present].rename(columns={k: columns[k] for k in present})
    for col in ("Date of leaving", "Date of joining"):
        if col in out.columns:
            out[col] = pd.to_datetime(out[col]).dt.strftime("%d %b %Y")
    return out


def ops_separations(merged: pd.DataFrame) -> pd.DataFrame:
    """Ops master rows with a last working day or non-joined status."""
    rows = merged[merged["merge_status"].isin(["Matched", "Ops only"])].copy()
    if "LastWorkingDate" not in rows.columns:
        return rows.iloc[0:0]

    lwd = _to_datetime(rows["LastWorkingDate"])
    status = rows.get("EmpStatusName", pd.Series(dtype=object)).astype(str).str.lower()
    mask = lwd.notna() | status.str.contains("left|separat|resign|termin|abscond", na=False)
    return rows.loc[mask]


def compute_attrition_summary(
    billing: pd.DataFrame,
    merged: pd.DataFrame,
) -> dict[str, Any]:
    billing_prep = prepare_billing_dates(billing)
    period = parse_billing_period(billing)
    prev_period = period - 1 if period is not None else None

    headcount = active_headcount(billing, period) if period is not None else len(billing_prep)

    current_leavers = (
        leavers_in_period(billing_prep, period) if period is not None else billing_prep.iloc[0:0]
    )
    prev_leavers = (
        leavers_in_period(billing_prep, prev_period)
        if prev_period is not None
        else billing_prep.iloc[0:0]
    )

    current_rate = monthly_attrition_rate(len(current_leavers), headcount)
    prev_rate = monthly_attrition_rate(len(prev_leavers), headcount)

    leaver_detail = enrich_leavers(current_leavers, merged)
    prev_detail = enrich_leavers(prev_leavers, merged)

    ops_left = ops_separations(merged)
    pending = merged[
        (merged["merge_status"].isin(["Matched", "Ops only"]))
        & (merged.get("EmpStatusName", "") == "Pending")
    ]

    has_prior_month_file = False  # extend when multiple billing exports are added

    def _label(p: pd.Period | None) -> str | None:
        return p.strftime("%B %Y") if p is not None else None

    return {
        "billing_period": _label(period) or "Unknown",
        "previous_period": _label(prev_period),
        "headcount": headcount,
        "current_leaver_count": len(current_leavers),
        "previous_leaver_count": len(prev_leavers),
        "current_attrition_rate": current_rate,
        "previous_attrition_rate": prev_rate,
        "previous_rate_reliable": has_prior_month_file and len(prev_leavers) > 0,
        "leavers_detail": leaver_detail,
        "previous_leavers_detail": prev_detail,
        "leavers_table": leaver_display_table(leaver_detail),
        "previous_leavers_table": leaver_display_table(prev_detail),
        "ops_separation_rows": len(ops_left),
        "pending_onboarding": pending,
        "data_notes": _build_data_notes(
            period,
            len(current_leavers),
            len(prev_leavers),
            ops_left,
            has_prior_month_file,
        ),
    }


def _build_data_notes(
    period: pd.Period | None,
    current_count: int,
    prev_count: int,
    ops_left: pd.DataFrame,
    has_prior_month_file: bool,
) -> list[str]:
    notes = []
    if period is not None:
        notes.append(
            f"Billing period detected: **{period.strftime('%B %Y')}** "
            f"(from Salary Processed Month)."
        )
    notes.append(
        "Attrition is calculated as: "
        "**(employees with Date of Leaving in that month ÷ billing headcount) × 100**."
    )
    if not has_prior_month_file:
        notes.append(
            "Only one billing file is loaded. "
            "**Last month's rate** is inferred from leaving dates in this file only — "
            "for a true month-on-month trend, add prior months' billing exports."
        )
    if prev_count == 0 and period is not None:
        prev_label = (period - 1).strftime("%B %Y")
        notes.append(
            f"No **Date of Leaving** values fall in {prev_label} in the current file "
            f"(shows 0% for that month)."
        )
    if len(ops_left) == 0:
        notes.append(
            "Ops master **Last Working Date** is empty for all rows; "
            "leavers are identified from billing **Date of Leaving** only."
        )
    if current_count == 0:
        notes.append("No leavers recorded in the current billing month.")
    return notes
