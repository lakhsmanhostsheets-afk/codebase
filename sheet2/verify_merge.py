"""One-off verification report for merge_tada.py output."""

import pandas as pd

w = pd.read_excel("working sheet.xlsx")
a = pd.read_excel("atomberg.xlsx")

w["Emp Code"] = w["Emp Code"].astype(str).str.strip()
a["Emp Code"] = a["Emp Code"].astype(str).str.strip()

common = sorted(set(w["Emp Code"]) & set(a["Emp Code"]))
only_w = sorted(set(w["Emp Code"]) - set(a["Emp Code"]))
only_a = sorted(set(a["Emp Code"]) - set(w["Emp Code"]))

samples = [
    ("Known example", "V5414153"),
    ("First matched", common[0] if common else None),
    ("Middle matched", common[len(common) // 2] if common else None),
    ("Last matched", common[-1] if common else None),
    ("Working only", only_w[0] if only_w else None),
    ("Atomberg only", only_a[0] if only_a else None),
    ("Atomberg only (TADA remark)", "V5500175" if "V5500175" in only_a else None),
]

print("=" * 72)
print("MANUAL VERIFICATION REPORT")
print("=" * 72)

all_ok = True
for label, code in samples:
    if not code:
        continue

    in_w = code in set(w["Emp Code"])
    in_a = code in set(a["Emp Code"])
    rw = w[w["Emp Code"] == code]
    ra = a[a["Emp Code"] == code]

    name = rw[" Name"].iloc[0] if in_w else ra[" Name"].iloc[0]

    print()
    print(f"--- {label}: {code} ({str(name).strip()}) ---")
    print(f"  In working sheet: {in_w}  |  In atomberg: {in_a}")

    amount = rw["Amount"].iloc[0] if in_w else None
    diff = ra["Difference Amount"].iloc[0] if in_a else None
    final = rw["Final Amount Payable"].iloc[0] if in_w else None
    week2 = ra["Week 2"].iloc[0] if in_a else None

    print(f"  Amount (working):              {amount}")
    print(f"  Difference Amount (atomberg):  {diff}")

    if in_w and in_a and pd.notna(amount) and pd.notna(diff):
        expected = amount + diff
        print(f"  Manual calc (Amount + Diff):   {expected}")
        print(f"  Final Amount Payable:          {final}")
        print(f"  Week 2:                        {week2}")
        ok = final == expected and week2 == expected and final == week2
    elif in_w and in_a:
        print(f"  Final Amount Payable:          {final}")
        print(f"  Week 2:                        {week2}")
        ok = pd.isna(final) and pd.isna(week2)
        print("  (Missing numeric input - expect blank)")
    elif in_w:
        print(f"  Final Amount Payable:          {final}")
        ok = pd.isna(final)
        print("  (No atomberg match - expect blank)")
    else:
        print(f"  Week 2:                        {week2}")
        ok = pd.isna(week2)
        print("  (No working sheet match - expect blank)")

    status = "PASS" if ok else "FAIL"
    print(f"  RESULT: {status}")
    if not ok:
        all_ok = False

merged = w[["Emp Code", " Name", "Amount", "Final Amount Payable"]].merge(
    a[["Emp Code", "Difference Amount", "Week 2"]], on="Emp Code", how="outer"
)
calc_rows = merged[merged["Amount"].notna() & merged["Difference Amount"].notna()].copy()
calc_rows["expected"] = calc_rows["Amount"] + calc_rows["Difference Amount"]
formula_wrong = calc_rows[calc_rows["Final Amount Payable"] != calc_rows["expected"]]
cross_wrong = merged[
    merged["Final Amount Payable"].notna()
    & merged["Week 2"].notna()
    & (merged["Final Amount Payable"] != merged["Week 2"])
]

print()
print("=" * 72)
print("FULL FILE AUDIT")
print("=" * 72)
print(f"  Total working rows:         {len(w)}")
print(f"  Total atomberg rows:        {len(a)}")
print(f"  Employees in both files:    {len(common)}")
print(f"  Rows with valid calculation: {calc_rows['Final Amount Payable'].notna().sum()}")
print(f"  Formula mismatches:         {len(formula_wrong)}")
print(f"  Final vs Week2 mismatches:  {len(cross_wrong)}")
print(f"  Working-only (blank final): {len(only_w)}")
print(f"  Atomberg-only (blank week2): {len(only_a)}")
print()
overall = "ALL CHECKS PASSED" if all_ok and not len(formula_wrong) and not len(cross_wrong) else "ISSUES FOUND"
print(f"OVERALL: {overall}")
