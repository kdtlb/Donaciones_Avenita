const API_URL = "https://script.google.com/macros/s/AKfycbylSWsMrDxVKUQBBtVcx51VGCm-rc4RcKcohbZiMVj88UgynLBf9HL1arcZjnJzfZSl/exec";

let comparisonChartInstance = null;
let expensesChartInstance = null;

function formatCurrency(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderSummary(data) {
  const resumen = data.resumen || {};

  setText("campaignDescription", resumen.descripcion || "Información pública de transparencia de la campaña.");
  setText("raisedAmount", formatCurrency(resumen.total_recaudado));
  setText("donationsCount", resumen.numero_donaciones || 0);
  setText("investedAmount", formatCurrency(resumen.total_invertido));
  setText("availableAmount", formatCurrency(resumen.saldo_disponible));

  setText("kpiRaised", formatCurrency(resumen.total_recaudado));
  setText("kpiDonations", resumen.numero_donaciones || 0);
  setText("kpiInvested", formatCurrency(resumen.total_invertido));
  setText("kpiAvailable", formatCurrency(resumen.saldo_disponible));
}

function renderExpensesTable(data) {
  const tableBody = document.getElementById("expensesTableBody");
  tableBody.innerHTML = "";

  const gastos = data.gastos || [];
  const total = gastos.reduce((sum, item) => sum + (Number(item.monto) || 0), 0);

  if (!gastos.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No hay datos disponibles.</td>
      </tr>
    `;
    return;
  }

  gastos.forEach((gasto) => {
    const monto = Number(gasto.monto) || 0;
    const percent = total > 0 ? ((monto / total) * 100).toFixed(1) : "0.0";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="category-pill">${gasto.categoria || "-"}</span></td>
      <td>${formatCurrency(monto)}</td>
      <td>${percent}%</td>
      <td>${gasto.descripcion || "-"}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderUpdates(data) {
  const updatesList = document.getElementById("updatesList");
  updatesList.innerHTML = "";

  const actualizaciones = data.actualizaciones || [];

  if (!actualizaciones.length) {
    updatesList.innerHTML = `<div class="empty-state">No hay actualizaciones por el momento.</div>`;
    return;
  }

  actualizaciones.forEach((item) => {
    const card = document.createElement("article");
    card.className = "update-card";
    card.innerHTML = `
      <span class="update-date">${item.fecha || ""}</span>
      <p>${item.texto || ""}</p>
    `;
    updatesList.appendChild(card);
  });
}

function renderComparisonChart(data) {
  const resumen = data.resumen || {};
  const recaudado = Number(resumen.total_recaudado) || 0;
  const invertido = Number(resumen.total_invertido) || 0;

  const ctx = document.getElementById("comparisonChart");

  if (comparisonChartInstance) {
    comparisonChartInstance.destroy();
  }

  comparisonChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Recaudado", "Invertido"],
      datasets: [
        {
          data: [recaudado, invertido],
          backgroundColor: [
            "rgba(231, 84, 166, 0.82)",
            "rgba(248, 180, 217, 0.92)"
          ],
          borderRadius: 12,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function renderExpensesChart(data) {
  const gastos = data.gastos || [];
  const ctx = document.getElementById("expensesChart");

  if (expensesChartInstance) {
    expensesChartInstance.destroy();
  }

  expensesChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: gastos.map(item => item.categoria || "Sin categoría"),
      datasets: [
        {
          data: gastos.map(item => Number(item.monto) || 0),
          backgroundColor: [
            "rgba(231, 84, 166, 0.86)",
            "rgba(248, 180, 217, 0.9)",
            "rgba(255, 153, 204, 0.85)",
            "rgba(214, 102, 165, 0.82)",
            "rgba(255, 204, 229, 0.95)",
            "rgba(199, 80, 147, 0.85)"
          ],
          borderColor: "#ffffff",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

async function loadData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    renderSummary(data);
    renderExpensesTable(data);
    renderUpdates(data);
    renderComparisonChart(data);
    renderExpensesChart(data);
  } catch (error) {
    console.error("Error cargando datos:", error);
    document.getElementById("campaignDescription").textContent =
      "No se pudo cargar la información desde Google Sheets.";
  }
}

document.addEventListener("DOMContentLoaded", loadData);