/**
 * Minimal canvas-based line chart renderer for the breakeven graphs.
 * No external chart library required - keeps the tool fully local/offline.
 */

function drawBreakevenChart(canvas, { fixedCosts, variableCostPerTicket, avgTicketPrice, projectedTicketsLow, projectedTicketsHigh, maxTickets }) {
  const ctx = canvas.getContext("2d");

  // Render at native device pixel density so the chart stays sharp on high-DPI screens.
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const padding = { top: 20, right: 20, bottom: 40, left: 65 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const maxRevenue = avgTicketPrice * maxTickets;
  const maxCost = fixedCosts + variableCostPerTicket * maxTickets;
  const maxY = Math.max(maxRevenue, maxCost) * 1.05;

  const xForTickets = (tickets) => padding.left + (tickets / maxTickets) * plotWidth;
  const yForValue = (value) => padding.top + plotHeight - (value / maxY) * plotHeight;

  // Gridlines + axis labels
  ctx.strokeStyle = "#e0e0e0";
  ctx.fillStyle = "#666";
  ctx.font = "11px sans-serif";
  ctx.lineWidth = 1;

  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const value = (maxY / ySteps) * i;
    const y = yForValue(value);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(`$${Math.round(value).toLocaleString()}`, 5, y + 4);
  }

  const xSteps = 5;
  for (let i = 0; i <= xSteps; i++) {
    const tickets = Math.round((maxTickets / xSteps) * i);
    const x = xForTickets(tickets);
    ctx.fillText(tickets.toLocaleString(), x - 10, height - padding.bottom + 15);
  }
  ctx.fillStyle = "#666";
  ctx.fillText("Patrons / month", width - padding.right - 92, height - 5);

  // Axis lines
  ctx.strokeStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(width - padding.right, padding.top + plotHeight);
  ctx.stroke();

  // Cost line
  ctx.strokeStyle = "#d9534f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xForTickets(0), yForValue(fixedCosts));
  ctx.lineTo(xForTickets(maxTickets), yForValue(fixedCosts + variableCostPerTicket * maxTickets));
  ctx.stroke();

  // Revenue line
  ctx.strokeStyle = "#5cb85c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xForTickets(0), yForValue(0));
  ctx.lineTo(xForTickets(maxTickets), yForValue(avgTicketPrice * maxTickets));
  ctx.stroke();

  // Breakeven marker - supporting reference point.
  const denom = avgTicketPrice - variableCostPerTicket;
  if (denom > 0) {
    const breakevenTickets = fixedCosts / denom;
    if (breakevenTickets <= maxTickets) {
      const bx = xForTickets(breakevenTickets);
      const by = yForValue(avgTicketPrice * breakevenTickets);
      ctx.fillStyle = "#999";
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#bbb";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, padding.top + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#777";
      ctx.font = "11px sans-serif";
      ctx.fillText(`Breakeven: ${Math.ceil(breakevenTickets).toLocaleString()} patrons`, bx + 8, by + 14);
    }
  }

  // Projected demand range - shade the area between the low and high estimate.
  if (
    Number.isFinite(projectedTicketsLow) &&
    Number.isFinite(projectedTicketsHigh) &&
    projectedTicketsHigh > projectedTicketsLow
  ) {
    const lowX = xForTickets(Math.min(projectedTicketsLow, maxTickets));
    const highX = xForTickets(Math.min(projectedTicketsHigh, maxTickets));
    ctx.fillStyle = "rgba(111, 78, 55, 0.08)";
    ctx.fillRect(lowX, padding.top, highX - lowX, plotHeight);
  }

  // Projected demand markers - the primary evidence for the profitability decision.
  const drawProjectedMarker = (tickets, label) => {
    if (!Number.isFinite(tickets) || tickets <= 0 || tickets > maxTickets) return;
    const px = xForTickets(tickets);
    const revenueAtTickets = avgTicketPrice * tickets;
    const costAtTickets = fixedCosts + variableCostPerTicket * tickets;
    const py = yForValue(revenueAtTickets);
    const profit = revenueAtTickets - costAtTickets;
    const markerColor = profit >= 0 ? "#2d7d2d" : "#a3272b";

    ctx.strokeStyle = markerColor;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, padding.top);
    ctx.lineTo(px, padding.top + plotHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 12px sans-serif";
    const text = `${label}: ${tickets.toLocaleString()} patrons (${profit >= 0 ? "+" : "-"}$${Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })})`;
    ctx.fillText(text, Math.min(px + 8, width - padding.right - 190), py < height / 2 ? py + 28 : py - 12);
  };

  drawProjectedMarker(projectedTicketsLow, "Low");
  drawProjectedMarker(projectedTicketsHigh, "High");

  // Legend
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#5cb85c";
  ctx.fillRect(padding.left, 4, 10, 10);
  ctx.fillStyle = "#333";
  ctx.fillText("Revenue", padding.left + 15, 13);

  ctx.fillStyle = "#d9534f";
  ctx.fillRect(padding.left + 90, 4, 10, 10);
  ctx.fillStyle = "#333";
  ctx.fillText("Total Cost", padding.left + 105, 13);
}
