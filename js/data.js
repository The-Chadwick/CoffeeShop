/**
 * Property data for the Coffee Shop Breakeven Comparison Tool.
 *
 * Edit these objects to compare different commercial spaces.
 * All monetary values are monthly unless otherwise noted.
 *
 * fixed costs include base rent, NNN charges, operating expenses, and staffing (per month)
 * staffing cost is computed from crew coverage, prep/closing labor, overtime, manager hours,
 *   owner labor value, wages, headcount, and payroll burden
 * projectedMonthlyTicketsLow / projectedMonthlyTicketsHigh = expected monthly patron range
 *   at this location, based on foot traffic/market research - the primary driver of the
 *   profitability comparison
 *
 * Each ticket represents one patron. Customer profile mix determines the weighted average
 * revenue and product cost per patron. Card processing is modeled per card-paying patron.
 *
 * Breakeven (patrons/month) = fixedCosts / weighted contribution margin per patron
 */

const sharedAssumptions = {
  cardProcessingPct: 2.9,
  cardProcessingFixedFee: 0.3,
  cardPaymentSharePct: 100,
  menuItems: {
    coffee: { label: "Coffee", price: 7, cost: 1.3 },
    muffin: { label: "Muffin", price: 5, cost: 2.5 },
    sandwich: { label: "Sandwich", price: 11, cost: 4.5 }
  },
  customerProfiles: [
    { name: "A - Coffee only", mixPct: 50, coffeeQty: 1, muffinQty: 0, sandwichQty: 0 },
    { name: "B - Coffee + muffin", mixPct: 25, coffeeQty: 1, muffinQty: 1, sandwichQty: 0 },
    { name: "C - Coffee + sandwich", mixPct: 25, coffeeQty: 1, muffinQty: 0, sandwichQty: 1 }
  ]
};

const properties = [
  {
    id: "propertyA",
    name: "Campfire Coffee",
    address: "838 E 2100 S, Salt Lake City, UT 84106",
    squareFootage: 3894,
    baseMonthlyRent: 7000,
    nnnRatePerSqFtAnnual: 4.622496148,
    monthlyUtilities: 450,
    monthlyInsurance: 300,
    monthlyInternet: 100,
    monthlyTrash: 100,
    monthlyCleaning: 0,
    monthlyRepairs: 0,
    monthlyLicenses: 100,
    monthlyAccounting: 0,
    monthlySoftware: 0,
    monthlyEquipmentLeases: 500,
    hoursOpenPerDay: 12,
    daysOpenPerWeek: 7,
    baseStaffOnDuty: 2,
    peakAdditionalStaff: 0,
    peakHoursPerDay: 0,
    prepClosingLaborHoursPerDay: 0,
    staffHeadcount: 6,
    avgHourlyWage: 16,
    overtimeThresholdHours: 40,
    overtimeMultiplier: 1.5,
    managerHoursPerWeek: 0,
    managerHourlyWage: 22,
    ownerHoursPerWeek: 0,
    ownerHourlyValue: 0,
    payrollBurdenPct: 18,
    otherFixedCosts: 800,
    projectedMonthlyTicketsLow: 1500,
    projectedMonthlyTicketsHigh: 6000,
    notes: "Old Campfire Lounge location. Insurance and internet are preliminary monthly estimates."
  },
  {
    id: "propertyB",
    name: "1045 E 2100 S - Sugar House Building",
    address: "1045 E 2100 S, Salt Lake City, UT 84106",
    squareFootage: 4800,
    baseMonthlyRent: 11000,
    nnnRatePerSqFtAnnual: 0,
    monthlyUtilities: 500,
    monthlyInsurance: 0,
    monthlyInternet: 0,
    monthlyTrash: 0,
    monthlyCleaning: 0,
    monthlyRepairs: 0,
    monthlyLicenses: 0,
    monthlyAccounting: 0,
    monthlySoftware: 0,
    monthlyEquipmentLeases: 0,
    hoursOpenPerDay: 14,
    daysOpenPerWeek: 7,
    baseStaffOnDuty: 3,
    peakAdditionalStaff: 0,
    peakHoursPerDay: 0,
    prepClosingLaborHoursPerDay: 0,
    staffHeadcount: 8,
    avgHourlyWage: 16,
    overtimeThresholdHours: 40,
    overtimeMultiplier: 1.5,
    managerHoursPerWeek: 0,
    managerHourlyWage: 22,
    ownerHoursPerWeek: 0,
    ownerHourlyValue: 0,
    payrollBurdenPct: 18,
    otherFixedCosts: 900,
    projectedMonthlyTicketsLow: 3600,
    projectedMonthlyTicketsHigh: 6720,
    notes: "Prime Sugar House corner (1045 E / 2100 S), high traffic/visibility/walkability. Entire freestanding building available for single-tenant lease: 3 levels, 4,800 SF above grade + 2,200 SF bonus basement (7,100 SF GLA total). Built 1941, recently remodeled. Elevator access, existing hood vent/kitchen, walk-in freezer, full kitchen and bar in basement, 4 bathrooms, ample parking (1.88/1,000 SF), Google Fiber, bus line. Term 2-10 years, Triple Net (NNN) lease, partial build-out, available now."
  }
];


