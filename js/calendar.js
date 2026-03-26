/* ===================================
   TaskPro — Premium Calendar Logic
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

  let currentDate = new Date();
  let currentView = "month";
  let allTasks = [];
  let allProjects = [];

  const calendarGrid = document.getElementById("calendarGrid");
  const monthYearDisplay = document.getElementById("currentMonthYear");

  // ========== INITIALIZE ==========
  async function init() {
    setupAuthUI();
    await fetchProjects();
    await fetchTeam();
    await renderCalendar();
    setupEventListeners();
  }

  function setupAuthUI() {
    const nameEl = document.getElementById("userName");
    const avatarEl = document.getElementById("userAvatar");
    if (nameEl) nameEl.textContent = user.name;
    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }

  async function fetchProjects() {
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers });
      allProjects = await res.json();
      populateProjectDropdown();
      populateProjectFilter();
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTeam() {
    try {
      const res = await fetch(`${API_BASE}/team`, { headers });
      allTeam = await res.json();
      populateAssigneeDropdown();
    } catch (err) {
      console.error(err);
    }
  }

  let allTeam = [];

  function populateAssigneeDropdown() {
    const dropdown = document.getElementById("taskAssignedTo");
    if (!dropdown) return;
    dropdown.innerHTML = '<option value="">Unassigned</option>';
    allTeam.forEach((m) => {
      dropdown.innerHTML += `<option value="${m._id}">${m.name}</option>`;
    });
  }

  function populateProjectFilter() {
    const filter = document.getElementById("projectFilter");
    // Clear existing besides 'All'
    filter.innerHTML = '<option value="All">All Projects</option>';
    allProjects.forEach((p) => {
      filter.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
    filter.onchange = () => renderCalendar();
  }

  async function fetchTasksForRange(start, end) {
    try {
      const projectId = document.getElementById("projectFilter").value;
      let url = `${API_BASE}/tasks?startDate=${start}&endDate=${end}`;
      if (projectId !== "All") url += `&projectId=${projectId}`;

      const res = await fetch(url, { headers });
      allTasks = await res.json();
    } catch (err) {
      console.error(err);
    }
  }

  // ========== CALENDAR RENDERING ==========
  async function renderCalendar() {
    // Animation out
    calendarGrid.style.opacity = "0";
    calendarGrid.style.transform = "translateY(10px)";

    setTimeout(async () => {
      calendarGrid.innerHTML = "";
      if (currentView === "month") {
        renderMonthView();
      } else {
        renderWeekView();
      }

      // Animation in
      calendarGrid.style.opacity = "1";
      calendarGrid.style.transform = "translateY(0)";
    }, 200);
  }

  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearDisplay.textContent = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(currentDate);

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fill days from previous month
    const lastDayPrevMonth = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, lastDayPrevMonth - i);
      calendarGrid.appendChild(createDayCell(d, true));
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      calendarGrid.appendChild(createDayCell(d));
    }

    // Fill next month days
    const totalCells = 42;
    const currentCells = calendarGrid.children.length;
    for (let i = 1; i <= totalCells - currentCells; i++) {
      const d = new Date(year, month + 1, i);
      calendarGrid.appendChild(createDayCell(d, true));
    }

    syncTasks();
  }

  function renderWeekView() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    monthYearDisplay.textContent = `Week of ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(startOfWeek)}`;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      calendarGrid.appendChild(createDayCell(d));
    }

    syncTasks();
  }

  async function syncTasks() {
    const cells = calendarGrid.querySelectorAll(".calendar-day");
    if (!cells.length) return;
    const start = cells[0].dataset.date;
    const end = cells[cells.length - 1].dataset.date;
    await fetchTasksForRange(start, end);
    mapTasksToCalendar();
  }

  function createDayCell(date, isOtherMonth = false) {
    const day = document.createElement("div");
    day.className = `calendar-day ${isOtherMonth ? "other-month" : ""}`;
    const dateStr = date.toISOString().split("T")[0];
    day.dataset.date = dateStr;

    const isToday = new Date().toDateString() === date.toDateString();
    if (isToday) day.classList.add("today");

    day.innerHTML = `
      <div class="day-number">${date.getDate()}</div>
      <div class="day-tasks"></div>
    `;

    day.onclick = (e) => {
      if (e.target.closest(".calendar-task")) return;
      openTaskModal(dateStr);
    };

    // Drag & Drop
    day.ondragover = (e) => {
      e.preventDefault();
      day.classList.add("drop-target");
    };
    day.ondragleave = () => day.classList.remove("drop-target");
    day.ondrop = async (e) => {
      e.preventDefault();
      day.classList.remove("drop-target");
      const taskId = e.dataTransfer.getData("text/plain");
      await updateTaskDeadline(taskId, dateStr);
    };

    return day;
  }

  function mapTasksToCalendar() {
    allTasks.forEach((task) => {
      if (!task.deadline) return;
      const dateStr = task.deadline.split("T")[0];
      const dayCell = calendarGrid.querySelector(
        `.calendar-day[data-date="${dateStr}"]`,
      );
      if (dayCell) {
        const project = allProjects.find((p) => p._id === task.projectId);
        const assignee = allTeam.find((m) => m._id === task.assignedTo);

        const taskEl = document.createElement("div");
        taskEl.className = `calendar-task anim-fade-in`;
        taskEl.innerHTML = `
              <span class="task-title-text">${task.title}</span>
              ${assignee ? `<span class="task-assignee-initials" title="${assignee.name}">${assignee.name.charAt(0)}</span>` : ""}
            `;
        taskEl.draggable = true;

        if (project) {
          taskEl.style.setProperty("--task-color", project.color);
        }

        taskEl.onclick = (e) => {
          e.stopPropagation();
          openEditModal(task);
        };

        taskEl.ondragstart = (e) => {
          e.dataTransfer.setData("text/plain", task._id);
          taskEl.classList.add("dragging");
        };
        taskEl.ondragend = () => taskEl.classList.remove("dragging");

        dayCell.querySelector(".day-tasks").appendChild(taskEl);
      }
    });
  }

  // ========== OPERATIONS ==========
  async function updateTaskDeadline(id, newDate) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ deadline: newDate }),
      });
      if (res.ok) {
        showToast("Task rescheduled");
        renderCalendar();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function openTaskModal(dateStr) {
    const modal = document.getElementById("taskModal");
    const form = document.getElementById("taskForm");
    form.reset();
    document.getElementById("modalTitle").textContent = "Create New Task";
    document.getElementById("taskProject").value = "";
    document.getElementById("taskAssignedTo").value = "";
    document.getElementById("taskStatus").value = "todo";
    document.getElementById("taskCategory").value = "General";
    document.getElementById("taskDeadline").value = dateStr;
    document.getElementById("deleteTaskBtn").classList.add("hidden");

    modal.classList.add("active");

    form.onsubmit = async (e) => {
      e.preventDefault();
      await saveTask();
    };
  }

  async function saveTask() {
    const newTask = {
      title: document.getElementById("taskTitle").value,
      description: document.getElementById("taskDesc").value,
      projectId: document.getElementById("taskProject").value || undefined,
      assignedTo: document.getElementById("taskAssignedTo").value || undefined,
      status: document.getElementById("taskStatus").value,
      category: document.getElementById("taskCategory").value,
      deadline: document.getElementById("taskDeadline").value,
    };

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        closeModal();
        renderCalendar();
        showToast("Task created successfully");
      }
    } catch (err) {
      console.error(err);
    }
  }

  function openEditModal(task) {
    const modal = document.getElementById("taskModal");
    const form = document.getElementById("taskForm");

    document.getElementById("modalTitle").textContent = "Edit Task";
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDesc").value = task.description || "";
    document.getElementById("taskProject").value = task.projectId || "";
    document.getElementById("taskAssignedTo").value =
      task.assignedTo?._id || task.assignedTo || "";
    document.getElementById("taskStatus").value = task.status;
    document.getElementById("taskCategory").value = task.category || "General";
    document.getElementById("taskDeadline").value = task.deadline
      ? task.deadline.split("T")[0]
      : "";

    const delBtn = document.getElementById("deleteTaskBtn");
    delBtn.classList.remove("hidden");
    delBtn.onclick = () => deleteTask(task._id);

    modal.classList.add("active");

    form.onsubmit = async (e) => {
      e.preventDefault();
      await updateTask(task._id);
    };
  }

  async function updateTask(id) {
    const updated = {
      title: document.getElementById("taskTitle").value,
      description: document.getElementById("taskDesc").value,
      projectId: document.getElementById("taskProject").value || undefined,
      assignedTo: document.getElementById("taskAssignedTo").value || undefined,
      status: document.getElementById("taskStatus").value,
      category: document.getElementById("taskCategory").value,
      deadline: document.getElementById("taskDeadline").value,
    };

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        closeModal();
        renderCalendar();
        showToast("Task updated successfully");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        closeModal();
        renderCalendar();
        showToast("Task deleted");
      }
    } catch (err) {
      console.error(err);
    }
  }

  function closeModal() {
    document.getElementById("taskModal").classList.remove("active");
  }

  function populateProjectDropdown() {
    const dropdown = document.getElementById("taskProject");
    dropdown.innerHTML = '<option value="">No Project (General)</option>';
    allProjects.forEach((p) => {
      dropdown.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
  }

  // ========== EVENTS ==========
  function setupEventListeners() {
    document.getElementById("prevMonth").onclick = () => {
      if (currentView === "month")
        currentDate.setMonth(currentDate.getMonth() - 1);
      else currentDate.setDate(currentDate.getDate() - 7);
      renderCalendar();
    };

    document.getElementById("nextMonth").onclick = () => {
      if (currentView === "month")
        currentDate.setMonth(currentDate.getMonth() + 1);
      else currentDate.setDate(currentDate.getDate() + 7);
      renderCalendar();
    };

    document.getElementById("todayBtn").onclick = () => {
      currentDate = new Date();
      renderCalendar();
    };

    document.querySelectorAll(".view-tab").forEach((tab) => {
      tab.onclick = () => {
        document
          .querySelectorAll(".view-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentView = tab.dataset.view;
        renderCalendar();
      };
    });

    document.getElementById("closeModal").onclick = closeModal;
    document.getElementById("cancelModalBtn").onclick = closeModal;
    document.getElementById("newTaskBtn").onclick = () =>
      openTaskModal(new Date().toISOString().split("T")[0]);

    // Global Search
    const searchInput = document.getElementById("searchInput");
    const resultsPanel = document.getElementById("searchResults");

    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        resultsPanel.classList.add("hidden");
        return;
      }
      const results = allTasks.filter((t) =>
        t.title.toLowerCase().includes(term),
      );
      resultsPanel.innerHTML =
        results
          .map(
            (r) => `
        <div class="search-result-item" onclick="handleSearchResultClick('${r._id}')">
          <div class="search-result-info">
            <span class="search-result-title">${r.title}</span>
            <span class="search-result-type">Task</span>
          </div>
        </div>
      `,
          )
          .join("") || '<div class="search-result-item">No tasks found</div>';
      resultsPanel.classList.remove("hidden");
    });

    window.handleSearchResultClick = (id) => {
      const task = allTasks.find((t) => t._id === id);
      if (task && task.deadline) {
        currentDate = new Date(task.deadline);
        renderCalendar();
        openEditModal(task);
      }
      resultsPanel.classList.add("hidden");
      searchInput.value = "";
    };

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Sidebar Toggle
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    toggleBtn?.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sidebarCollapsed",
        sidebar.classList.contains("collapsed"),
      );
    });

    // Logout
    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });

    // Mobile Sidebar
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    mobileMenuBtn?.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
    });
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${msg}`;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
  }

  init();
});
