/* ===================================
   TaskPro — Analytics Logic
   =================================== */

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }

  const API_BASE = "http://localhost:5000/api";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let allProjects = [];
  let charts = {};

  // ========== INITIALIZE ==========
  async function init() {
    setupAuthUI();
    await fetchProjects();
    await refreshData();
    setupEventListeners();
  }

  function setupAuthUI() {
    document.getElementById("userName").textContent = user.name;
    document.getElementById("userAvatar").textContent = user.name
      .charAt(0)
      .toUpperCase();
  }

  async function fetchProjects() {
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers });
      allProjects = await res.json();
      populateProjectFilter();
    } catch (err) {
      console.error(err);
    }
  }

  function populateProjectFilter() {
    const filter = document.getElementById("projectFilter");
    allProjects.forEach((p) => {
      filter.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
    filter.onchange = refreshData;
  }

  async function refreshData() {
    const projectId = document.getElementById("projectFilter").value;
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    let query = `?1=1`;
    if (projectId !== "All") query += `&projectId=${projectId}`;
    if (start) query += `&startDate=${start}`;
    if (end) query += `&endDate=${end}`;

    await Promise.all([
      updateOverview(query),
      updateStatusChart(query),
      updateTimeChart(),
      updateProjectProgress(),
    ]);
  }

  // ========== DATA UPDATERS ==========
  async function updateOverview(query) {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview${query}`, {
        headers,
      });
      const data = await res.json();

      document.getElementById("totalTasks").textContent = data.total;
      document.getElementById("completedTasks").textContent = data.done;
      document.getElementById("completionRate").textContent =
        `${data.completionRate}%`;
      document.getElementById("overdueTasks").textContent = data.overdue;
    } catch (err) {
      console.error(err);
    }
  }

  async function updateStatusChart(query) {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview${query}`, {
        headers,
      });
      const data = await res.json();

      renderPieChart(
        "statusChart",
        ["To Do", "In Progress", "Done"],
        [data.todo, data.inProgress, data.done],
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function updateTimeChart() {
    try {
      const res = await fetch(`${API_BASE}/analytics/tasks-over-time`, {
        headers,
      });
      const data = await res.json();

      renderLineChart(
        "timeChart",
        data.map((d) => d.date),
        data.map((d) => d.count),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function updateProjectProgress() {
    try {
      const res = await fetch(`${API_BASE}/analytics/project-progress`, {
        headers,
      });
      const data = await res.json();

      renderBarChart(
        "projectChart",
        data.map((d) => d.name),
        data.map((d) => d.percent),
        data.map((d) => d.color),
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ========== CHART RENDERING ==========
  function renderPieChart(id, labels, data) {
    if (charts[id]) charts[id].destroy();

    charts[id] = new Chart(document.getElementById(id), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: ["#7c3aed", "#06b6d4", "#10b981"],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "#a0a0b8" } },
        },
        cutout: "70%",
      },
    });
  }

  function renderLineChart(id, labels, data) {
    if (charts[id]) charts[id].destroy();

    charts[id] = new Chart(document.getElementById(id), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tasks Created",
            data: data,
            borderColor: "#7c3aed",
            backgroundColor: "rgba(124, 58, 237, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: "#7c3aed",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#a0a0b8" },
          },
          x: { grid: { display: false }, ticks: { color: "#a0a0b8" } },
        },
      },
    });
  }

  function renderBarChart(id, labels, data, colors) {
    if (charts[id]) charts[id].destroy();

    charts[id] = new Chart(document.getElementById(id), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderRadius: 10,
            barThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#a0a0b8", callback: (v) => v + "%" },
          },
          x: { grid: { display: false }, ticks: { color: "#a0a0b8" } },
        },
      },
    });
  }

  // ========== EVENTS ==========
  function setupEventListeners() {
    document.getElementById("refreshBtn").onclick = refreshData;
    document.getElementById("startDate").onchange = refreshData;
    document.getElementById("endDate").onchange = refreshData;

    // Sidebar Toggle
    const sidebar = document.getElementById("sidebar");
    document.getElementById("sidebarToggle")?.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });

    // Logout
    document.getElementById("logoutBtn").onclick = () => {
      localStorage.clear();
      window.location.href = "login.html";
    };
  }

  init();
});
