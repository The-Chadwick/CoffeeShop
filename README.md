# Coffee Shop Property Comparison

A small, browser-based tool for comparing commercial spaces as potential coffee shop locations. It estimates monthly profitability from per-patron customer profiles, property costs, staffing, and a low-to-high patron demand range.

## Features

- Compare multiple properties side by side, including address, square footage, base rent, NNN, operating expenses, and notes.
- Define coffee, muffin, and sandwich prices and product costs, then model three customer profiles with adjustable patron mix percentages and item quantities.
- Treat one ticket as one individual patron, not one party or group. Customer profile percentages should total 100%; calculations normalize the mix if they do not.
- Estimate card processing using editable assumptions, initially set to 2.9% plus $0.30 per card-paid patron. The share of sales paid by card is editable as well. Because transaction grouping is not modeled, the fixed fee is approximated once per card-paying patron.
- Estimate labor from base crew coverage, peak overlap, prep/closing labor-hours, hourly crew headcount, overtime threshold and multiplier, manager hours, and optional owner labor value. The monthly estimate shows regular crew, overtime, manager, and owner-value components.
- Enter low and high monthly patron estimates; matching daily estimates stay in sync using a 30-day month.
- See projected monthly profit and revenue, estimated demand, margin of safety, total fixed costs, and breakeven patrons and revenue.
- View a chart of revenue versus total costs, with the breakeven point and projected demand markers.
- Export the current assumptions and property values as JavaScript source for updating `js/data.js`.
- Use the app locally without a server, external service, or third-party library.

## Run

Open `index.html` in a modern browser. There is no build or install step.

## Use and Export

Edit the menu assumptions, customer profiles, card fee assumptions, and each property's fields in the page. Results and charts recalculate as values change. Labor cost is calculated from coverage and wage assumptions rather than entered directly.

The initial menu prices and product costs are illustrative starting values; replace them with the shop's expected prices and actual supplier costs.

The **Export Properties as JS** button reveals JavaScript declarations for `sharedAssumptions` and `properties`. Copy that output into `js/data.js` to keep the edited values for future visits. Edits made in the page are held only in the current browser session; they are not saved automatically, and export does not download or write a file.

To add, remove, or change the structure of properties, edit the `properties` array in `js/data.js`. Monetary values are monthly unless stated otherwise.

## Calculation Notes

- Weekly crew hours = days open × (open hours × base crew + peak hours × additional peak crew + prep/closing labor-hours). Prep/closing input is total labor-hours per day, not elapsed clock time.
- Crew weekly hours are distributed evenly across hourly headcount. Hours above headcount × regular-hours threshold are paid at the overtime multiplier; this is an estimate, not an employee-level schedule, and may not capture overtime caused by uneven shifts or local rules.
- Manager hours are costed separately without being added to crew coverage, and are included in payroll burden. Owner hours are costed at the entered hourly value without payroll burden; this optional value helps show the cost of unpaid owner work.
- Monthly labor cost = regular crew wages + overtime crew wages + manager wages (with payroll burden) + owner labor value, annualized by 52 / 12.
- Monthly NNN estimate = square footage × annual NNN rate per square foot / 12.
- Monthly fixed costs = base rent + NNN + utilities + insurance + internet + trash + cleaning + repairs + licenses + accounting + software + equipment leases + calculated staffing + other fixed costs.
- Weighted revenue and product cost per patron are calculated from menu item prices/costs, quantities in each profile, and profile mix percentages.
- Estimated card fee per patron = (weighted patron revenue × card processing percentage + fixed transaction fee) × card-paid share.
- Contribution margin per patron = weighted patron revenue − weighted product cost − estimated card fee.
- Breakeven patrons per month = monthly fixed costs / contribution margin per patron. If the contribution margin is zero or negative, breakeven is unavailable.
- Projected monthly profit = contribution margin per patron × monthly patron estimate − monthly fixed costs.
- Daily patron estimates use 30 days per month. Monthly staffing uses 52 weeks per year divided by 12 months.

These are planning estimates, not accounting, payment processing, or lease-cost advice. The 2.9% + $0.30 card fee is an editable planning default, not a quote for a particular processor. NNN and newly added operating expenses default to $0 because actual amounts depend on the property and vendor quotes. The model does not separately account for taxes, financing, seasonality, or costs not represented in the fields.

## Project Files

- `index.html` defines the page and reusable form templates.
- `css/style.css` contains the responsive layout and visual styles.
- `js/data.js` contains the shared assumptions and initial property data.
- `js/app.js` builds the forms, recalculates results, and handles export.
- `js/chart.js` draws the breakeven chart on a canvas.