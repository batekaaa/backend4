let chart;

function buildChart(labels, values, labelName) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: labelName, data: values }]
    }
  });
}

document.getElementById("load").addEventListener("click", async () => {
  const field = document.getElementById("field").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  const qs = new URLSearchParams({ field });
  if (start) qs.set("start_date", start);
  if (end) qs.set("end_date", end);

  // данные
  const r1 = await fetch(`/api/measurements?${qs.toString()}`);
  const dataJson = await r1.json();
  if (!r1.ok) {
    alert(dataJson.error || "Error");
    return;
  }

  const labels = dataJson.data.map((d) => new Date(d.timestamp).toISOString().slice(0, 10));
  const values = dataJson.data.map((d) => d[field]);

  buildChart(labels, values, field);

  // метрики
  const r2 = await fetch(`/api/measurements/metrics?${qs.toString()}`);
  const metricsJson = await r2.json();
  document.getElementById("metrics").textContent = JSON.stringify(metricsJson, null, 2);
});
