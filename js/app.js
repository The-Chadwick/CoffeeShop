/**
 * Main application logic: renders property forms, computes breakeven figures,
 * draws charts, and lets the user export edited values back to data.js format.
 */

const FIELD_DEFS = [
  { key: "name", label: "Property Name", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "squareFootage", label: "Square Footage", type: "number", step: "100" },
  { key: "baseMonthlyRent", label: "Base Monthly Rent ($)", type: "number", step: "100" },
  { key: "nnnRatePerSqFtAnnual", label: "NNN Rate ($ / sq ft / year)", type: "number", step: "0.1" },
  { key: "monthlyUtilities", label: "Monthly Utilities ($)", type: "number", step: "50" },
  { key: "monthlyInsurance", label: "Monthly Insurance ($)", type: "number", step: "25" },
  { key: "monthlyInternet", label: "Monthly Internet ($)", type: "number", step: "10" },
  { key: "monthlyTrash", label: "Monthly Trash ($)", type: "number", step: "10" },
  { key: "monthlyCleaning", label: "Monthly Cleaning ($)", type: "number", step: "25" },
  { key: "monthlyRepairs", label: "Monthly Repairs ($)", type: "number", step: "25" },
  { key: "monthlyLicenses", label: "Monthly Licenses ($)", type: "number", step: "10" },
  { key: "monthlyAccounting", label: "Monthly Accounting ($)", type: "number", step: "25" },
  { key: "monthlySoftware", label: "Monthly Software ($)", type: "number", step: "10" },
  { key: "monthlyEquipmentLeases", label: "Equipment Leases ($ / mo)", type: "number", step: "25" },
  { key: "otherFixedCosts", label: "Other Fixed Costs ($)", type: "number" },
  { key: "notes", label: "Notes", type: "text" }
];

// Crew coverage, off-hours labor, team size, and separately costed management/owner labor.
const STAFFING_FIELD_DEFS = [
  { key: "hoursOpenPerDay", label: "Hours Open / Day", type: "number", step: "0.5" },
  { key: "daysOpenPerWeek", label: "Days Open / Week", type: "number", step: "1" },
  { key: "baseStaffOnDuty", label: "Base Crew on Duty", type: "number", step: "0.5" },
  { key: "peakAdditionalStaff", label: "Extra Crew During Peak", type: "number", step: "0.5" },
  { key: "peakHoursPerDay", label: "Peak Overlap Hours / Day", type: "number", step: "0.5" },
  { key: "prepClosingLaborHoursPerDay", label: "Prep / Closing Labor-Hours / Day", type: "number", step: "0.5" },
  { key: "staffHeadcount", label: "Hourly Crew Headcount", type: "number", step: "1" },
  { key: "avgHourlyWage", label: "Avg Hourly Wage ($)", type: "number", step: "0.25" },
  { key: "overtimeThresholdHours", label: "Regular Hours / Employee / Week", type: "number", step: "1" },
  { key: "overtimeMultiplier", label: "Overtime Pay Multiplier", type: "number", step: "0.1" },
  { key: "managerHoursPerWeek", label: "Manager Hours / Week", type: "number", step: "1" },
  { key: "managerHourlyWage", label: "Manager Hourly Wage ($)", type: "number", step: "0.25" },
  { key: "ownerHoursPerWeek", label: "Owner Hours / Week", type: "number", step: "1" },
  { key: "ownerHourlyValue", label: "Owner Hourly Value ($)", type: "number", step: "0.25" },
  { key: "payrollBurdenPct", label: "Payroll Burden (%)", type: "number", step: "1" }
];

// Average weeks per month (52 weeks / 12 months) used to annualize weekly staffing hours.
const WEEKS_PER_MONTH = 52 / 12;

// Monthly/daily patron estimate pairs kept in sync assuming a 30 day month.
const TICKET_ESTIMATE_FIELDS = [
  { key: "projectedMonthlyTicketsLow", label: "Low Estimate" },
  { key: "projectedMonthlyTicketsHigh", label: "High Estimate" }
];

const DAYS_PER_MONTH = 30;

const CARD_FIELD_DEFS = [
  { key: "cardProcessingPct", label: "Card Processing (%)", type: "number", step: "0.1" },
  { key: "cardProcessingFixedFee", label: "Card Fee per Transaction ($)", type: "number", step: "0.01" },
  { key: "cardPaymentSharePct", label: "Sales Paid by Card (%)", type: "number", step: "1" }
];

const MENU_ITEMS = ["coffee", "muffin", "sandwich"];
const PROFILE_PRODUCT_FIELDS = [
  { key: "coffeeQty", label: "Coffee" },
  { key: "muffinQty", label: "Muffin" },
  { key: "sandwichQty", label: "Sandwich" }
];

const panels = [];

// Clones the #field-row-template and wires up a single labeled input.
function createFieldRow(field, value, onInput) {
  const template = document.getElementById("field-row-template");
  const row = template.content.firstElementChild.cloneNode(true);

  row.querySelector(".field-label").textContent = field.label;

  const input = row.querySelector("input");
  input.type = field.type;
  if (field.step) input.step = field.step;
  if (field.min !== undefined) input.min = field.min;
  if (field.max !== undefined) input.max = field.max;
  input.value = value;
  input.dataset.key = field.key;
  input.addEventListener("input", () => onInput(input.value));

  return row;
}

// Clones the #ticket-pair-row-template and keeps a monthly input and a daily input
// in sync in both directions, assuming a 30 day month.
function createTicketPairRow(field, property, onChange) {
  const template = document.getElementById("ticket-pair-row-template");
  const row = template.content.firstElementChild.cloneNode(true);

  row.querySelector(".field-label").textContent = field.label;

  const monthlyInput = row.querySelector(".monthly-input");
  const dailyInput = row.querySelector(".daily-input");
  monthlyInput.dataset.key = field.key;

  const setFromMonthly = (monthlyValue) => {
    property[field.key] = monthlyValue;
    monthlyInput.value = monthlyValue;
    dailyInput.value = Math.round((monthlyValue / DAYS_PER_MONTH) * 10) / 10;
    onChange();
  };

  const setFromDaily = (dailyValue) => {
    const monthlyValue = Math.round(dailyValue * DAYS_PER_MONTH);
    property[field.key] = monthlyValue;
    monthlyInput.value = monthlyValue;
    dailyInput.value = dailyValue;
    onChange();
  };

  setFromMonthly(Number(property[field.key]));

  monthlyInput.addEventListener("input", () => setFromMonthly(Number(monthlyInput.value)));
  dailyInput.addEventListener("input", () => setFromDaily(Number(dailyInput.value)));

  return row;
}

function calcStaffingBreakdown(p) {
  const daysOpen = Number(p.daysOpenPerWeek);
  const weeklyCrewHours = daysOpen * (
    Number(p.hoursOpenPerDay) * Number(p.baseStaffOnDuty) +
    Number(p.peakHoursPerDay) * Number(p.peakAdditionalStaff) +
    Number(p.prepClosingLaborHoursPerDay)
  );
  const headcount = Math.max(1, Number(p.staffHeadcount));
  const regularCapacity = headcount * Number(p.overtimeThresholdHours);
  const regularCrewHours = Math.min(weeklyCrewHours, regularCapacity);
  const overtimeCrewHours = Math.max(0, weeklyCrewHours - regularCapacity);
  const crewWeeklyWages = regularCrewHours * Number(p.avgHourlyWage) +
    overtimeCrewHours * Number(p.avgHourlyWage) * Number(p.overtimeMultiplier);
  const managerWeeklyWages = Number(p.managerHoursPerWeek) * Number(p.managerHourlyWage);
  const ownerWeeklyValue = Number(p.ownerHoursPerWeek) * Number(p.ownerHourlyValue);
  const burdenMultiplier = 1 + Number(p.payrollBurdenPct) / 100;
  const monthlyFactor = WEEKS_PER_MONTH * burdenMultiplier;
  const monthlyWeeks = WEEKS_PER_MONTH;

  return {
    weeklyCrewHours,
    regularCrewHours,
    overtimeCrewHours,
    regularMonthlyCost: regularCrewHours * Number(p.avgHourlyWage) * monthlyFactor,
    overtimeMonthlyCost: overtimeCrewHours * Number(p.avgHourlyWage) * Number(p.overtimeMultiplier) * monthlyFactor,
    managerMonthlyCost: managerWeeklyWages * monthlyFactor,
    ownerMonthlyValue: ownerWeeklyValue * monthlyWeeks,
    totalMonthlyCost: (crewWeeklyWages + managerWeeklyWages) * monthlyFactor + ownerWeeklyValue * monthlyWeeks
  };
}

function calcMonthlyStaffing(p) {
  return calcStaffingBreakdown(p).totalMonthlyCost;
}

function calcFixedCosts(p) {
  return (
    Number(p.baseMonthlyRent) +
    (Number(p.squareFootage) * Number(p.nnnRatePerSqFtAnnual)) / 12 +
    Number(p.monthlyUtilities) +
    Number(p.monthlyInsurance) +
    Number(p.monthlyInternet) +
    Number(p.monthlyTrash) +
    Number(p.monthlyCleaning) +
    Number(p.monthlyRepairs) +
    Number(p.monthlyLicenses) +
    Number(p.monthlyAccounting) +
    Number(p.monthlySoftware) +
    Number(p.monthlyEquipmentLeases) +
    calcMonthlyStaffing(p) +
    Number(p.otherFixedCosts)
  );
}

function getProfileMixTotal() {
  return sharedAssumptions.customerProfiles.reduce((total, profile) => total + Number(profile.mixPct), 0);
}

function getWeightedCustomerEconomics() {
  const mixTotal = getProfileMixTotal();
  if (mixTotal <= 0) return { revenue: 0, productCost: 0 };

  return sharedAssumptions.customerProfiles.reduce((weighted, profile) => {
    const share = Number(profile.mixPct) / mixTotal;
    const revenue = MENU_ITEMS.reduce((sum, item) => sum + Number(profile[`${item}Qty`]) * Number(sharedAssumptions.menuItems[item].price), 0);
    const productCost = MENU_ITEMS.reduce((sum, item) => sum + Number(profile[`${item}Qty`]) * Number(sharedAssumptions.menuItems[item].cost), 0);
    weighted.revenue += revenue * share;
    weighted.productCost += productCost * share;
    return weighted;
  }, { revenue: 0, productCost: 0 });
}

function getPerTicketEconomics() {
  const weighted = getWeightedCustomerEconomics();
  const cardShare = Number(sharedAssumptions.cardPaymentSharePct) / 100;
  const cardFee = (weighted.revenue * Number(sharedAssumptions.cardProcessingPct) / 100 + Number(sharedAssumptions.cardProcessingFixedFee)) * cardShare;
  return {
    avgTicketPrice: weighted.revenue,
    variableCostPerTicket: weighted.productCost + cardFee
  };
}

function calcMargin() {
  const economics = getPerTicketEconomics();
  return economics.avgTicketPrice - economics.variableCostPerTicket;
}

function calcBreakevenTickets(p) {
  const fixedCosts = calcFixedCosts(p);
  const margin = calcMargin();
  if (margin <= 0) return Infinity;
  return fixedCosts / margin;
}

// Profitability at a given demand level - the primary decision driver.
function calcProfitAtTickets(p, tickets) {
  const fixedCosts = calcFixedCosts(p);
  return calcMargin() * Number(tickets) - fixedCosts;
}

function buildPropertyPanel(property, index) {
  const template = document.getElementById("property-panel-template");
  const panel = template.content.firstElementChild.cloneNode(true);
  panel.dataset.index = index;

  const heading = panel.querySelector(".property-heading");
  heading.textContent = property.name;

  panel._canvas = panel.querySelector(".breakeven-canvas");
  panel._resultsEl = panel.querySelector(".results");
  panel._computedStaffingEl = panel.querySelector(".computed-staffing-value");
  panel._staffingBreakdownEl = panel.querySelector(".staffing-breakdown");

  const form = panel.querySelector(".property-form");

  FIELD_DEFS.forEach((field) => {
    const row = createFieldRow(field, property[field.key], (raw) => {
      property[field.key] = field.type === "number" ? Number(raw) : raw;
      if (field.key === "name") heading.textContent = property.name;
      updateResults(panel, property);
    });
    form.appendChild(row);
  });

  const staffingForm = panel.querySelector(".staffing-calculator-form");
  STAFFING_FIELD_DEFS.forEach((field) => {
    const row = createFieldRow(field, property[field.key], (raw) => {
      property[field.key] = Number(raw);
      updateResults(panel, property);
    });
    staffingForm.appendChild(row);
  });

  const ticketEstimatesForm = panel.querySelector(".ticket-estimates-form");
  TICKET_ESTIMATE_FIELDS.forEach((field) => {
    const row = createTicketPairRow(field, property, () => updateResults(panel, property));
    ticketEstimatesForm.appendChild(row);
  });

  return panel;
}

function buildAssumptionsPanel() {
  const template = document.getElementById("assumptions-panel-template");
  const panel = template.content.firstElementChild.cloneNode(true);

  const form = panel.querySelector(".assumptions-form");
  CARD_FIELD_DEFS.forEach((field) => {
    const row = createFieldRow(field, sharedAssumptions[field.key], (raw) => {
      sharedAssumptions[field.key] = Number(raw);
      updateAllResults();
    });
    form.appendChild(row);
  });

  const menuForm = panel.querySelector(".menu-form");
  MENU_ITEMS.forEach((item) => {
    const menuItem = sharedAssumptions.menuItems[item];
    const priceRow = createFieldRow({ key: `${item}Price`, label: `${menuItem.label} Price ($)`, type: "number", step: "0.25" }, menuItem.price, (raw) => {
      menuItem.price = Number(raw);
      updateAllResults();
    });
    const costRow = createFieldRow({ key: `${item}Cost`, label: `${menuItem.label} Product Cost ($)`, type: "number", step: "0.1" }, menuItem.cost, (raw) => {
      menuItem.cost = Number(raw);
      updateAllResults();
    });
    menuForm.append(priceRow, costRow);
  });

  const profilesForm = panel.querySelector(".profiles-form");
  sharedAssumptions.customerProfiles.forEach((profile, index) => {
    const profileRow = document.createElement("div");
    profileRow.className = "customer-profile";
    const title = document.createElement("h4");
    title.textContent = `Customer Profile ${String.fromCharCode(65 + index)}`;
    profileRow.appendChild(title);

    const profileName = createFieldRow({ key: "name", label: "Profile Name", type: "text" }, profile.name, (raw) => {
      profile.name = raw;
    });
    profileRow.appendChild(profileName);
    const mixRow = createFieldRow({ key: "mixPct", label: "% of Patrons", type: "number", step: "1", min: "0", max: "100" }, profile.mixPct, (raw) => {
      profile.mixPct = Number(raw);
      updateMixStatus(panel);
      updateAllResults();
    });
    profileRow.appendChild(mixRow);
    PROFILE_PRODUCT_FIELDS.forEach((field) => {
      const row = createFieldRow({ ...field, type: "number", step: "1" }, profile[field.key], (raw) => {
        profile[field.key] = Number(raw);
        updateAllResults();
      });
      profileRow.appendChild(row);
    });
    profilesForm.appendChild(profileRow);
  });

  updateMixStatus(panel);

  return panel;
}

function updateMixStatus(panel) {
  const total = getProfileMixTotal();
  const status = panel.querySelector(".mix-total");
  status.textContent = `Customer mix total: ${total.toFixed(1)}%${Math.abs(total - 100) < 0.05 ? "" : " (should equal 100%; estimates normalize the mix)"}`;
  status.classList.toggle("invalid", Math.abs(total - 100) >= 0.05);
}

function updateAllResults() {
  panels.forEach(({ panel, property }) => updateResults(panel, property));
}

function updateResults(panel, property) {
  const fixedCosts = calcFixedCosts(property);
  const breakevenTickets = calcBreakevenTickets(property);
  const economics = getPerTicketEconomics();
  const breakevenRevenue = Number.isFinite(breakevenTickets)
    ? breakevenTickets * economics.avgTicketPrice
    : Infinity;

  if (panel._computedStaffingEl) {
    const staffing = calcStaffingBreakdown(property);
    panel._computedStaffingEl.textContent = `$${staffing.totalMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`;
    panel._staffingBreakdownEl.textContent = `Crew: ${staffing.weeklyCrewHours.toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs/wk (${staffing.overtimeCrewHours.toLocaleString(undefined, { maximumFractionDigits: 1 })} OT) · Regular $${staffing.regularMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} · OT $${staffing.overtimeMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} · Manager $${staffing.managerMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} · Owner labor value $${staffing.ownerMonthlyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  const lowTickets = Number(property.projectedMonthlyTicketsLow);
  const highTickets = Number(property.projectedMonthlyTicketsHigh);
  const lowProfit = calcProfitAtTickets(property, lowTickets);
  const highProfit = calcProfitAtTickets(property, highTickets);
  const lowRevenue = lowTickets * economics.avgTicketPrice;
  const highRevenue = highTickets * economics.avgTicketPrice;

  const formatSigned = (value) => `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const marginOfSafety = (tickets) => (Number.isFinite(breakevenTickets) ? tickets - breakevenTickets : tickets);

  const results = panel._resultsEl;
  results.innerHTML = "";

  const addStat = (container, label, value, extraClass) => {
    const div = document.createElement("div");
    div.className = extraClass ? `stat ${extraClass}` : "stat";
    div.innerHTML = `<span class="stat-label">${label}</span><span class="stat-value">${value}</span>`;
    container.appendChild(div);
  };

  // Primary framing: expected profitability across the projected low-to-high demand range.
  const headline = document.createElement("div");
  headline.className = "headline " + (lowProfit >= 0 ? "positive" : highProfit >= 0 ? "mixed" : "negative");
  results.appendChild(headline);

  addStat(
    headline,
    "Projected Monthly Profit",
    `${formatSigned(lowProfit)} to ${formatSigned(highProfit)}`,
    "stat-primary"
  );
  addStat(
    headline,
    "Projected Monthly Revenue",
    `$${lowRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} to $${highRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  );
  addStat(
    headline,
    "Estimated Demand",
    `${lowTickets.toLocaleString()}/mo to ${highTickets.toLocaleString()}/mo estimated patrons`
  );
  addStat(
    headline,
    "Margin of Safety",
    `${Math.round(marginOfSafety(lowTickets)).toLocaleString()} to ${Math.round(marginOfSafety(highTickets)).toLocaleString()} patrons`
  );

  // Supporting evidence: breakeven math backing up the projection above.
  const supportingHeading = document.createElement("div");
  supportingHeading.className = "supporting-heading";
  supportingHeading.textContent = "Breakeven Analysis (supporting evidence)";
  results.appendChild(supportingHeading);

  const supporting = document.createElement("div");
  supporting.className = "supporting-stats";
  results.appendChild(supporting);

  addStat(supporting, "Total Fixed Costs / mo", `$${fixedCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  addStat(supporting, "Estimated NNN / mo", `$${((Number(property.squareFootage) * Number(property.nnnRatePerSqFtAnnual)) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  addStat(supporting, "Weighted Revenue / Patron", `$${economics.avgTicketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  addStat(supporting, "Contribution / Patron", `$${calcMargin().toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  addStat(
    supporting,
    "Breakeven Patrons / mo",
    Number.isFinite(breakevenTickets)
      ? `${Math.ceil(breakevenTickets).toLocaleString()} (${Math.ceil(breakevenTickets / 30).toLocaleString()}/day on a 30 day month)`
      : "N/A (no positive margin)"
  );
  addStat(
    supporting,
    "Breakeven Revenue / mo",
    Number.isFinite(breakevenRevenue) ? `$${breakevenRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "N/A"
  );

  const highWatermark = Number.isFinite(breakevenTickets) ? Math.max(breakevenTickets, highTickets) : highTickets;
  const maxTickets = Math.ceil((highWatermark * 1.3) / 50) * 50 || 100;

  drawBreakevenChart(panel._canvas, {
    fixedCosts,
    variableCostPerTicket: economics.variableCostPerTicket,
    avgTicketPrice: economics.avgTicketPrice,
    projectedTicketsLow: lowTickets,
    projectedTicketsHigh: highTickets,
    maxTickets: Math.max(maxTickets, 50)
  });
}

function renderApp() {
  const assumptionsContainer = document.getElementById("assumptions-container");
  assumptionsContainer.innerHTML = "";
  assumptionsContainer.appendChild(buildAssumptionsPanel());

  const container = document.getElementById("properties-container");
  container.innerHTML = "";
  panels.length = 0;
  properties.forEach((property, index) => {
    const panel = buildPropertyPanel(property, index);
    panels.push({ panel, property });
    container.appendChild(panel);
  });

  // Panels must be attached to the DOM before drawing so canvas.clientWidth is accurate.
  panels.forEach(({ panel, property }) => updateResults(panel, property));
}

function exportPropertiesAsJs() {
  const formatValue = (value) => (typeof value === "string" || (value !== null && typeof value === "object") ? JSON.stringify(value) : value);

  const assumptionsEntries = Object.entries(sharedAssumptions)
    .map(([key, value]) => `  ${key}: ${formatValue(value)}`)
    .join(",\n");
  const assumptionsBlock = `const sharedAssumptions = {\n${assumptionsEntries}\n};\n`;

  const lines = properties.map((p) => {
    const entries = Object.entries(p)
      .map(([key, value]) => `    ${key}: ${formatValue(value)}`)
      .join(",\n");
    return `  {\n${entries}\n  }`;
  });
  const propertiesBlock = `const properties = [\n${lines.join(",\n")}\n];\n`;

  return `${assumptionsBlock}\n${propertiesBlock}`;
}

function setupExportButton() {
  const button = document.getElementById("export-btn");
  const output = document.getElementById("export-output");
  button.addEventListener("click", () => {
    output.value = exportPropertiesAsJs();
    output.hidden = false;
    output.focus();
    output.select();
  });
}

function setupResizeListener() {
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    // Debounce so we don't redraw on every intermediate resize event.
    resizeTimeout = setTimeout(() => {
      panels.forEach(({ panel, property }) => updateResults(panel, property));
    }, 100);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderApp();
  setupExportButton();
  setupResizeListener();
});
