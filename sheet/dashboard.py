"""Interactive AO Smith ops + billing dashboard."""

from __future__ import annotations

import pandas as pd
import plotly.express as px
import streamlit as st

from attrition import compute_attrition_summary
from data_pipeline import load_merged, summary_metrics

st.set_page_config(
    page_title="AO Smith Workforce Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .block-container { padding-top: 1.2rem; }
    div[data-testid="stMetric"] {
        background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 0.75rem 1rem;
    }
    div[data-testid="stMetric"] label { color: #94a3b8 !important; }
    div[data-testid="stMetric"] div[data-testid="stMetricValue"] {
        color: #f8fafc !important;
        font-weight: 700;
    }
    h1 { color: #0f172a; font-weight: 800; letter-spacing: -0.02em; }
    </style>
    """,
    unsafe_allow_html=True,
)

PALETTE = px.colors.qualitative.Set2


@st.cache_data
def get_data():
    ops, billing, merged = load_merged()
    attrition = compute_attrition_summary(billing, merged)
    return ops, billing, merged, attrition


ops_df, billing_df, merged_df, attrition = get_data()
metrics = summary_metrics(merged_df)

st.title("AO Smith — Ops & Billing Intelligence")
st.caption(
    "Merged on **Employee ID** (`EmployeeId` ↔ `EmployeeNo`). "
    "Salary match tolerance: ₹100 on Gross, Net, and CTC."
)

# --- Sidebar filters ---
st.sidebar.header("Filters")
status_options = ["All"] + sorted(merged_df["merge_status"].dropna().unique().tolist())
status_filter = st.sidebar.selectbox("Merge status", status_options)

designations = sorted(
    merged_df["display_designation"].dropna().astype(str).unique().tolist()
)
designation_filter = st.sidebar.multiselect(
    "Designation", designations, default=designations
)

states = sorted(merged_df["display_state"].dropna().astype(str).unique().tolist())
state_filter = st.sidebar.multiselect("State", states, default=states)

salary_flags = ["All", "OK", "Mismatch", "—"]
salary_filter = st.sidebar.selectbox("Salary comparison", salary_flags)

filtered = merged_df.copy()
if status_filter != "All":
    filtered = filtered[filtered["merge_status"] == status_filter]
if designation_filter:
    filtered = filtered[filtered["display_designation"].isin(designation_filter)]
if state_filter:
    filtered = filtered[filtered["display_state"].isin(state_filter)]
if salary_filter != "All":
    filtered = filtered[filtered["salary_flag"] == salary_filter]

# --- KPI row ---
c1, c2, c3, c4, c5, c6 = st.columns(6)
c1.metric("Ops roster", metrics["ops_count"])
c2.metric("Billing roster", metrics["billing_count"])
c3.metric("Matched", metrics["matched"])
c4.metric("Ops only", metrics["ops_only"])
c5.metric("Pay mismatches", metrics["salary_mismatches"])
c6.metric("Avg CTC (matched)", f"₹{metrics['avg_ctc']:,.0f}")

c7, c8 = st.columns(2)
c7.metric("Total net pay (billing)", f"₹{metrics['total_net_pay']:,.0f}")
c8.metric("Grand total (billing)", f"₹{metrics['total_grand_total']:,.0f}")

st.divider()

tab_overview, tab_compare, tab_mismatch, tab_attrition, tab_data = st.tabs(
    ["Overview", "Compare", "Mismatches", "Attrition", "Data & export"]
)

with tab_overview:
    col_l, col_r = st.columns(2)

    by_status = (
        merged_df.groupby("merge_status", as_index=False, observed=True)
        .size()
        .rename(columns={"size": "count"})
    )
    fig_status = px.pie(
        by_status,
        names="merge_status",
        values="count",
        title="Roster overlap",
        color_discrete_sequence=PALETTE,
        hole=0.45,
    )
    fig_status.update_layout(margin=dict(t=40, b=20, l=20, r=20), height=360)
    col_l.plotly_chart(fig_status, use_container_width=True)

    matched = filtered[filtered["merge_status"] == "Matched"]
    if not matched.empty and "display_designation" in matched.columns:
        by_desig = (
            matched.groupby("display_designation", as_index=False, observed=True)[
                "Grand Total"
            ]
            .sum()
            .sort_values("Grand Total", ascending=True)
        )
        fig_desig = px.bar(
            by_desig,
            x="Grand Total",
            y="display_designation",
            orientation="h",
            title="Billing grand total by designation",
            color="Grand Total",
            color_continuous_scale="Blues",
        )
        fig_desig.update_layout(
            showlegend=False, margin=dict(t=40, b=20, l=20, r=20), height=360
        )
        col_r.plotly_chart(fig_desig, use_container_width=True)

    col_a, col_b = st.columns(2)
    if not matched.empty:
        by_state = (
            matched.groupby("display_state", as_index=False, observed=True)
            .agg(headcount=("EmployeeId", "count"), net_pay=("NET PAY", "sum"))
            .sort_values("headcount", ascending=False)
        )
        fig_state = px.bar(
            by_state,
            x="display_state",
            y="headcount",
            title="Headcount by state",
            color="headcount",
            color_continuous_scale="Teal",
        )
        fig_state.update_layout(
            showlegend=False, margin=dict(t=40, b=20, l=20, r=20), height=340
        )
        col_a.plotly_chart(fig_state, use_container_width=True)

        fig_net = px.scatter(
            matched,
            x="Gross",
            y="GROSS",
            hover_name="display_name",
            color="display_designation",
            title="Ops vs billing gross (matched)",
            labels={"Gross": "Ops gross", "GROSS": "Billing gross"},
            color_discrete_sequence=PALETTE,
        )
        max_val = max(matched["Gross"].max(), matched["GROSS"].max())
        fig_net.add_shape(
            type="line",
            x0=0,
            y0=0,
            x1=max_val,
            y1=max_val,
            line=dict(dash="dash", color="#64748b"),
        )
        fig_net.update_layout(margin=dict(t=40, b=20, l=20, r=20), height=340)
        col_b.plotly_chart(fig_net, use_container_width=True)

with tab_compare:
    compare_cols = filtered[
        filtered["merge_status"] == "Matched"
    ][
        [
            "EmployeeId",
            "display_name",
            "display_designation",
            "display_state",
            "Gross",
            "GROSS",
            "gross_diff",
            "Net",
            "NET PAY",
            "net_diff",
            "CTC",
            "Full CTC",
            "ctc_diff",
            "Grand Total",
            "salary_flag",
        ]
    ].copy()
    compare_cols = compare_cols.rename(
        columns={
            "Gross": "Ops gross",
            "GROSS": "Billing gross",
            "Net": "Ops net",
            "NET PAY": "Billing net",
            "CTC": "Ops CTC",
            "Full CTC": "Billing full CTC",
        }
    )
    st.dataframe(
        compare_cols.style.format(
            {
                "Ops gross": "₹{:,.0f}",
                "Billing gross": "₹{:,.0f}",
                "gross_diff": "₹{:,.0f}",
                "Ops net": "₹{:,.0f}",
                "Billing net": "₹{:,.0f}",
                "net_diff": "₹{:,.0f}",
                "Ops CTC": "₹{:,.0f}",
                "Billing full CTC": "₹{:,.0f}",
                "ctc_diff": "₹{:,.0f}",
                "Grand Total": "₹{:,.0f}",
            },
            na_rep="—",
        ),
        use_container_width=True,
        height=420,
    )

    mismatch_rows = compare_cols[compare_cols["salary_flag"] == "Mismatch"]
    if not mismatch_rows.empty:
        melt = mismatch_rows.melt(
            id_vars=["display_name"],
            value_vars=["gross_diff", "net_diff", "ctc_diff"],
            var_name="field",
            value_name="delta",
        )
        melt["field"] = melt["field"].str.replace("_diff", "", regex=False)
        fig_delta = px.bar(
            melt,
            x="display_name",
            y="delta",
            color="field",
            barmode="group",
            title="Salary deltas (ops − billing)",
            labels={"delta": "₹ difference", "display_name": "Employee"},
            color_discrete_sequence=PALETTE,
        )
        fig_delta.update_layout(margin=dict(t=40, b=80, l=20, r=20), height=380)
        st.plotly_chart(fig_delta, use_container_width=True)

with tab_mismatch:
    st.subheader("Employees in ops but not billing")
    ops_only = filtered[filtered["merge_status"] == "Ops only"][
        ["EmployeeId", "display_name", "display_designation", "display_state", "Gross", "Net", "CTC"]
    ]
    st.dataframe(ops_only, use_container_width=True, hide_index=True)

    st.subheader("Salary mismatches (matched employees)")
    mismatches = filtered[
        (filtered["merge_status"] == "Matched") & (filtered["salary_flag"] == "Mismatch")
    ][
        [
            "EmployeeId",
            "display_name",
            "Gross",
            "GROSS",
            "gross_diff",
            "Net",
            "NET PAY",
            "net_diff",
            "CTC",
            "Full CTC",
            "ctc_diff",
        ]
    ]
    if mismatches.empty:
        st.success("No salary mismatches above tolerance for current filters.")
    else:
        st.dataframe(mismatches, use_container_width=True, hide_index=True)

with tab_attrition:
    st.subheader("Attrition & separations")
    for note in attrition["data_notes"]:
        st.info(note)

    prev_label = attrition["previous_period"] or "Prior month"
    a1, a2, a3, a4, a5 = st.columns(5)
    a1.metric("Billing headcount", attrition["headcount"])
    a2.metric(
        f"Leavers ({attrition['billing_period']})",
        attrition["current_leaver_count"],
    )
    rate_cur = attrition["current_attrition_rate"]
    a3.metric(
        f"Attrition rate ({attrition['billing_period']})",
        f"{rate_cur}%" if rate_cur is not None else "N/A",
    )
    a4.metric(f"Leavers ({prev_label})", attrition["previous_leaver_count"])
    rate_prev = attrition["previous_attrition_rate"]
    prev_help = (
        "From leaving dates in this file only; add prior billing months for history."
    )
    a5.metric(
        f"Attrition rate ({prev_label})",
        f"{rate_prev}%" if rate_prev is not None else "N/A",
        help=prev_help,
    )

    trend = pd.DataFrame(
        {
            "period": [prev_label, attrition["billing_period"]],
            "attrition_rate": [rate_prev or 0, rate_cur or 0],
            "leavers": [
                attrition["previous_leaver_count"],
                attrition["current_leaver_count"],
            ],
        }
    )
    fig_attr = px.bar(
        trend,
        x="period",
        y="attrition_rate",
        text="leavers",
        title="Monthly attrition rate (%)",
        labels={"attrition_rate": "Attrition %", "period": "Month"},
        color="attrition_rate",
        color_continuous_scale="Reds",
    )
    fig_attr.update_traces(texttemplate="%{text} leavers", textposition="outside")
    fig_attr.update_layout(
        showlegend=False,
        margin=dict(t=40, b=20, l=20, r=20),
        height=320,
        yaxis_range=[0, max(5, (rate_cur or 0) * 1.5)],
    )
    st.plotly_chart(fig_attr, use_container_width=True)

    st.subheader(f"Employees who left — {attrition['billing_period']}")
    if attrition["leavers_table"].empty:
        st.success("No separations with a leaving date in the current billing month.")
    else:
        st.dataframe(attrition["leavers_table"], use_container_width=True, hide_index=True)

    if attrition["previous_leaver_count"] > 0:
        st.subheader(f"Employees who left — {prev_label}")
        st.dataframe(
            attrition["previous_leavers_table"],
            use_container_width=True,
            hide_index=True,
        )

    pending = attrition["pending_onboarding"]
    if not pending.empty:
        st.subheader("Pending onboarding (ops — not attrition)")
        st.dataframe(
            pending[
                [
                    c
                    for c in [
                        "EmployeeId",
                        "display_name",
                        "display_designation",
                        "display_state",
                        "DateofJoining",
                        "EmpStatusName",
                    ]
                    if c in pending.columns
                ]
            ],
            use_container_width=True,
            hide_index=True,
        )

with tab_data:
    st.subheader("Filtered merged dataset")
    st.dataframe(filtered, use_container_width=True, height=400)
    csv = filtered.to_csv(index=False).encode("utf-8")
    st.download_button(
        "Download merged CSV",
        csv,
        file_name="ao_smith_merged.csv",
        mime="text/csv",
    )

    st.subheader("Source files")
    st.write(f"- Ops master: `{len(ops_df)}` rows")
    st.write(f"- Billing: `{len(billing_df)}` rows (valid employee IDs)")
