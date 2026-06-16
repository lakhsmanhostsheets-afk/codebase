# Import Mapping Specification

## Workbook Inputs

- `AO Smith Open list` (fallback: `Open List`)
- `Line Up Final`

## Open List -> Canonical

- Store identity uses:
  - `Store Name`
  - `City`
  - `State`
- Store attributes mapped:
  - `Account Name`, `Store Address`, `Supervisor`, `POA`, `Region`, `Vertical`
- Open position mapped:
  - `Designation`
  - `Position count`
  - `Open Position Count`
  - `Date of Open`
  - `Selection date`

## Line Up Final -> Canonical

- Candidate fields:
  - `Name`, `Contact No.`, `Qualification`, `Current Salary`, `Expected Salary`
  - `Current /Previous Organisation`, `City`, `State`
- Lineup fields:
  - `Client Remarks`, `Final Remarks`, `Feedback Date`, `TAT For Feedback`, `Remarks`
- Store linkage key:
  - `Store Name + City + State`

## Status Mapping

- Interview Pending -> `INTERVIEW_PENDING`
- Rejected -> `REJECTED`
- Final Selection -> `FINAL_SELECTION`
- Client Selected -> `CLIENT_SELECTED`
- Back Out -> `BACK_OUT`
- On Hold -> `ON_HOLD`
- Other / empty -> `OTHER`
