# UI Wireframe Specification

## Screen: Dashboard Home

1. Header
   - Title
   - Subtitle
   - Logout button

2. Filter Bar (responsive grid)
   - State
   - City
   - Supervisor
   - Account
   - From date
   - To date

3. Action Row
   - Refresh dashboard
   - Import workbook
   - Export Excel
   - Export PDF
   - Save dashboard
   - Reload saved dashboards

4. Activity Banner
   - Import status / errors

5. Saved Dashboard Chips
   - Click to apply saved layout and filters

6. Dashboard Builder (draggable widgets)
   - KPI Summary widget
   - State chart widget
   - State table widget

## Styling Guidelines

- Tailwind utility-first design.
- shadcn component tokens for spacing and typography.
- Horizontal scroll minimized:
  - widgets stack on smaller screens
  - table area has isolated overflow with sticky header
  - card-first dashboard and details in table section
