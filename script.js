const STORAGE_KEYS = {
  users: 'work-tracker-users-v2',
  session: 'work-tracker-session-v1',
};

const DEMO_EMAIL = 'demo@worktracker.app';

const elements = {
  authPanel: document.querySelector('#auth-panel'),
  dashboard: document.querySelector('#dashboard'),
  authForm: document.querySelector('#auth-form'),
  emailInput: document.querySelector('#email-input'),
  demoLoginBtn: document.querySelector('#demo-login-btn'),
  signOutBtn: document.querySelector('#sign-out-btn'),
  userPill: document.querySelector('#user-pill'),
  todayLabel: document.querySelector('#today-label'),
  taskForm: document.querySelector('#work-form'),
  taskTitle: document.querySelector('#task-title'),
  taskDate: document.querySelector('#task-date'),
  taskStart: document.querySelector('#task-start'),
  taskEnd: document.querySelector('#task-end'),
  taskCategory: document.querySelector('#task-category'),
  exerciseForm: document.querySelector('#exercise-form'),
  exerciseName: document.querySelector('#exercise-name'),
  exerciseDate: document.querySelector('#exercise-date'),
  exerciseMinutes: document.querySelector('#exercise-minutes'),
  exerciseType: document.querySelector('#exercise-type'),
  taskList: document.querySelector('#task-list'),
  exerciseList: document.querySelector('#exercise-list'),
  activityList: document.querySelector('#activity-list'),
  weeklyBars: document.querySelector('#weekly-bars'),
  monthlyTasks: document.querySelector('#monthly-tasks'),
  monthlyDone: document.querySelector('#monthly-done'),
  monthlyWorkoutMinutes: document.querySelector('#monthly-workout-minutes'),
  monthlyFocus: document.querySelector('#monthly-focus'),
  todayLabelSmall: document.querySelector('#today-label-small'),
  taskCount: document.querySelector('#task-count'),
  doneCount: document.querySelector('#done-count'),
  exerciseMinutesTotal: document.querySelector('#exercise-minutes-total'),
  focusScore: document.querySelector('#focus-score'),
  weeklyRange: document.querySelector('#weekly-range'),
  monthlyLabel: document.querySelector('#monthly-label'),
  historySummary: document.querySelector('#history-summary'),
};

const state = {
  users: loadUsers(),
  currentUserEmail: loadSession(),
};

initialize();

function initialize() {
  const today = todayISO();
  elements.taskDate.value = today;
  elements.exerciseDate.value = today;

  elements.authForm.addEventListener('submit', handleAuthSubmit);
  elements.demoLoginBtn.addEventListener('click', () => signIn(DEMO_EMAIL));
  elements.signOutBtn.addEventListener('click', signOut);
  elements.taskForm.addEventListener('submit', handleTaskSubmit);
  elements.exerciseForm.addEventListener('submit', handleExerciseSubmit);

  renderAuthState();
  render();
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const email = normalizeEmail(elements.emailInput.value);

  if (!email) {
    elements.emailInput.focus();
    return;
  }

  signIn(email);
}

function signIn(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  let user = state.users.find((entry) => entry.email === normalized);
  if (!user) {
    user = createUser(normalized);
    state.users.push(user);
    saveUsers();
  }

  state.currentUserEmail = normalized;
  saveSession();
  elements.authForm.reset();
  renderAuthState();
  render();
}

function signOut() {
  state.currentUserEmail = null;
  saveSession();
  elements.authForm.reset();
  renderAuthState();
  render();
}

function renderAuthState() {
  const currentUser = getCurrentUser();
  const signedIn = Boolean(currentUser);

  elements.authPanel.classList.toggle('hidden', signedIn);
  elements.dashboard.classList.toggle('hidden', !signedIn);
  elements.userPill.textContent = signedIn ? `Signed in: ${currentUser.email}` : '';
  elements.userPill.classList.toggle('hidden', !signedIn);
  elements.signOutBtn.classList.toggle('hidden', !signedIn);
}

function handleTaskSubmit(event) {
  event.preventDefault();

  const user = getCurrentUser();
  if (!user) return;

  const title = elements.taskTitle.value.trim();
  const start = elements.taskStart.value || '09:00';
  const end = elements.taskEnd.value || '10:00';

  if (!title) {
    elements.taskTitle.focus();
    return;
  }

  if (end && start && end <= start) {
    elements.taskEnd.focus();
    elements.taskEnd.setCustomValidity('End time must be later than the start time.');
    elements.taskEnd.reportValidity();
    return;
  }

  elements.taskEnd.setCustomValidity('');

  const task = {
    id: createId(),
    title,
    date: elements.taskDate.value || todayISO(),
    start,
    end,
    category: elements.taskCategory.value,
    done: false,
  };

  user.tasks = user.tasks || [];
  user.tasks.unshift(task);
  saveUsers();

  elements.taskForm.reset();
  elements.taskDate.value = todayISO();
  elements.taskStart.value = '09:00';
  elements.taskEnd.value = '10:00';
  render();
}

function handleExerciseSubmit(event) {
  event.preventDefault();

  const user = getCurrentUser();
  if (!user) return;

  const activity = elements.exerciseName.value.trim();
  const minutes = Number(elements.exerciseMinutes.value);
  const date = elements.exerciseDate.value || todayISO();

  if (!activity) {
    elements.exerciseName.focus();
    return;
  }

  if (!Number.isFinite(minutes) || minutes <= 0) {
    elements.exerciseMinutes.focus();
    elements.exerciseMinutes.setCustomValidity('Please enter a valid workout length in minutes.');
    elements.exerciseMinutes.reportValidity();
    return;
  }

  elements.exerciseMinutes.setCustomValidity('');

  user.workouts = user.workouts || [];
  user.workouts.unshift({
    id: createId(),
    activity,
    date,
    minutes,
    type: elements.exerciseType.value,
  });

  saveUsers();
  elements.exerciseForm.reset();
  elements.exerciseDate.value = todayISO();
  render();
}

function render() {
  const user = getCurrentUser();
  if (!user) {
    return;
  }

  renderOverview(user);
  renderTasks(user);
  renderWorkouts(user);
  renderMonthlyStats(user);
  renderWeeklyChart(user);
  renderHistory(user);
}

function renderOverview(user) {
  const tasks = user.tasks || [];
  const workouts = user.workouts || [];
  const today = todayISO();
  const todaysTasks = tasks.filter((task) => task.date === today).length;
  const todayCompletedTasks = tasks.filter((task) => task.date === today && task.done).length;
  const todaysMinutes = workouts
    .filter((workout) => workout.date === today)
    .reduce((total, workout) => total + Number(workout.minutes || 0), 0);
  const totalMinutes = workouts.reduce((total, workout) => total + Number(workout.minutes || 0), 0);
  const focusScore = tasks.length === 0 ? 0 : Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100);

  elements.taskCount.textContent = todaysTasks;
  elements.doneCount.textContent = todayCompletedTasks;
  elements.exerciseMinutesTotal.textContent = `${todaysMinutes || totalMinutes || 0} min`;
  elements.focusScore.textContent = `${focusScore}%`;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  elements.todayLabel.textContent = formattedDate;
  elements.todayLabelSmall.textContent = formattedDate;
}

function renderTasks(user) {
  const tasks = [...(user.tasks || [])].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.start.localeCompare(b.start);
  });

  if (tasks.length === 0) {
    elements.taskList.innerHTML = '<li class="empty">No work items scheduled yet.</li>';
    return;
  }

  elements.taskList.innerHTML = tasks
    .map(
      (task) => `
        <li class="list-item ${task.done ? 'is-done' : ''}" data-id="${task.id}">
          <div class="task-main">
            <input type="checkbox" ${task.done ? 'checked' : ''} aria-label="Mark ${task.title} complete" data-action="toggle-task" data-id="${task.id}">
            <div class="task-copy">
              <span class="task-title">${escapeHtml(task.title)}</span>
              <span class="task-meta">${formatDateShort(task.date)} • ${task.start} - ${task.end}</span>
            </div>
          </div>

          <div class="task-actions">
            <span class="badge ${getBadgeClass(task.category)}">${escapeHtml(task.category)}</span>
            <button class="icon-btn" type="button" data-action="delete-task" data-id="${task.id}" aria-label="Delete ${task.title}">✕</button>
          </div>
        </li>
      `,
    )
    .join('');

  elements.taskList.querySelectorAll('[data-action="toggle-task"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const taskId = checkbox.dataset.id;
      const task = user.tasks.find((item) => item.id === taskId);
      if (!task) return;
      task.done = checkbox.checked;
      saveUsers();
      render();
    });
  });

  elements.taskList.querySelectorAll('[data-action="delete-task"]').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.id;
      user.tasks = user.tasks.filter((task) => task.id !== taskId);
      saveUsers();
      render();
    });
  });
}

function renderWorkouts(user) {
  const workouts = [...(user.workouts || [])].sort((a, b) => b.date.localeCompare(a.date));

  if (workouts.length === 0) {
    elements.exerciseList.innerHTML = '<li class="empty">No exercise logged yet.</li>';
    return;
  }

  elements.exerciseList.innerHTML = workouts
    .map(
      (workout) => `
        <li class="list-item">
          <div class="task-main">
            <div class="task-copy">
              <span class="task-title">${escapeHtml(workout.activity)}</span>
              <span class="task-meta">${formatDateShort(workout.date)} • ${workout.minutes} min</span>
            </div>
          </div>

          <div class="task-actions">
            <span class="badge exercise">${escapeHtml(workout.type)}</span>
            <button class="icon-btn" type="button" data-action="delete-workout" data-id="${workout.id}" aria-label="Delete ${workout.activity}">✕</button>
          </div>
        </li>
      `,
    )
    .join('');

  elements.exerciseList.querySelectorAll('[data-action="delete-workout"]').forEach((button) => {
    button.addEventListener('click', () => {
      const workoutId = button.dataset.id;
      user.workouts = user.workouts.filter((workout) => workout.id !== workoutId);
      saveUsers();
      render();
    });
  });
}

function renderWeeklyChart(user) {
  const days = [];
  const workouts = user.workouts || [];
  const tasks = user.tasks || [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const iso = todayISO(date);
    const minutes = workouts
      .filter((workout) => workout.date === iso)
      .reduce((sum, workout) => sum + Number(workout.minutes || 0), 0);
    const taskCount = tasks.filter((task) => task.date === iso).length;
    days.push({
      label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      minutes: minutes + taskCount * 15,
      iso,
    });
  }

  const maxMinutes = Math.max(...days.map((day) => day.minutes), 30);
  const weeklySummary = days.reduce((total, day) => total + day.minutes, 0);

  elements.weeklyRange.textContent = `Last 7 days • ${weeklySummary} pts`;
  elements.weeklyBars.innerHTML = days
    .map(
      (day) => `
        <div class="week-day">
          <div class="bar-track">
            <div class="bar-fill" style="height: ${(day.minutes / maxMinutes) * 100}%"></div>
          </div>
          <span>${day.label}</span>
        </div>
      `,
    )
    .join('');
}

function renderMonthlyStats(user) {
  const tasks = user.tasks || [];
  const workouts = user.workouts || [];
  const monthDate = new Date();
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

  const monthlyTasks = tasks.filter((task) => task.date.startsWith(monthKey)).length;
  const monthlyDone = tasks.filter((task) => task.date.startsWith(monthKey) && task.done).length;
  const monthlyMinutes = workouts
    .filter((workout) => workout.date.startsWith(monthKey))
    .reduce((total, workout) => total + Number(workout.minutes || 0), 0);
  const focus = monthlyTasks === 0 ? 0 : Math.round((monthlyDone / monthlyTasks) * 100);

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthDate);

  elements.monthlyLabel.textContent = monthLabel;
  elements.monthlyTasks.textContent = monthlyTasks;
  elements.monthlyDone.textContent = monthlyDone;
  elements.monthlyWorkoutMinutes.textContent = `${monthlyMinutes} min`;
  elements.monthlyFocus.textContent = `${focus}%`;
}

function renderHistory(user) {
  const tasks = (user.tasks || []).map((task) => ({
    id: task.id,
    date: task.date,
    time: task.start || '00:00',
    kind: 'task',
    title: task.title,
    description: `${task.category} • ${task.done ? 'Completed' : 'Open'}`,
    badge: getBadgeClass(task.category),
  }));

  const workouts = (user.workouts || []).map((workout) => ({
    id: workout.id,
    date: workout.date,
    time: '00:00',
    kind: 'workout',
    title: workout.activity,
    description: `${workout.minutes} min • ${workout.type}`,
    badge: 'exercise',
  }));

  const activity = [...tasks, ...workouts]
    .sort((a, b) => {
      const dateA = `${a.date}T${a.time}`;
      const dateB = `${b.date}T${b.time}`;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 8);

  elements.historySummary.textContent = `Latest ${activity.length} updates`;
  elements.activityList.innerHTML = activity
    .map(
      (entry) => `
        <li class="activity-item">
          <div class="activity-dot ${entry.kind === 'task' ? 'task' : 'workout'}"></div>
          <div class="activity-copy">
            <strong>${escapeHtml(entry.title)}</strong>
            <span>${escapeHtml(entry.description)}</span>
          </div>
          <div class="activity-meta">
            <span>${formatDateShort(entry.date)}</span>
            <span class="badge ${entry.badge}">${entry.kind === 'task' ? 'Task' : 'Workout'}</span>
          </div>
        </li>
      `,
    )
    .join('');
}

function loadUsers() {
  const stored = localStorage.getItem(STORAGE_KEYS.users);
  if (!stored) {
    const demoUser = createDemoUser();
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([demoUser]));
    return [demoUser];
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const demoUser = createDemoUser();
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([demoUser]));
      return [demoUser];
    }

    return parsed.map(normalizeUser).filter(Boolean);
  } catch (error) {
    const demoUser = createDemoUser();
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([demoUser]));
    return [demoUser];
  }
}

function createDemoUser() {
  const user = createUser(DEMO_EMAIL, 'Demo User');
  user.tasks = [
    {
      id: createId(),
      title: 'Deep work sprint',
      date: todayISO(),
      start: '09:00',
      end: '11:00',
      category: 'Work',
      done: false,
    },
    {
      id: createId(),
      title: 'Email and planning',
      date: todayISO(),
      start: '14:00',
      end: '15:00',
      category: 'Personal',
      done: true,
    },
  ];

  user.workouts = [
    {
      id: createId(),
      activity: 'Morning run',
      date: todayISO(),
      minutes: 35,
      type: 'Cardio',
    },
  ];

  return user;
}

function getCurrentUser() {
  return state.users.find((user) => user.email === state.currentUserEmail) || null;
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
}

function saveSession() {
  localStorage.setItem(STORAGE_KEYS.session, state.currentUserEmail || '');
}

function loadSession() {
  const saved = localStorage.getItem(STORAGE_KEYS.session);
  return saved ? String(saved).trim() : null;
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;

  const email = normalizeEmail(user.email);
  if (!email) return null;

  return {
    email,
    name: String(user.name || email.split('@')[0]),
    tasks: Array.isArray(user.tasks) ? user.tasks.map(normalizeTask).filter(Boolean) : [],
    workouts: Array.isArray(user.workouts) ? user.workouts.map(normalizeWorkout).filter(Boolean) : [],
  };
}

function normalizeTask(task) {
  if (!task || typeof task !== 'object') return null;

  return {
    id: task.id || createId(),
    title: String(task.title || '').trim(),
    date: task.date || todayISO(),
    start: task.start || '09:00',
    end: task.end || '10:00',
    category: ['Work', 'Personal', 'Exercise'].includes(task.category) ? task.category : 'Work',
    done: Boolean(task.done),
  };
}

function normalizeWorkout(workout) {
  if (!workout || typeof workout !== 'object') return null;

  const minutes = Number(workout.minutes);

  return {
    id: workout.id || createId(),
    activity: String(workout.activity || '').trim(),
    date: workout.date || todayISO(),
    minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 0,
    type: String(workout.type || 'Cardio'),
  };
}

function createUser(email, name = email.split('@')[0]) {
  return {
    email: normalizeEmail(email),
    name,
    tasks: [],
    workouts: [],
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function createId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getBadgeClass(category) {
  const normalized = String(category || '').toLowerCase();

  if (normalized === 'exercise') return 'exercise';
  if (normalized === 'personal') return 'personal';
  return 'work';
}

function todayISO(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().split('T')[0];
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Today';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
