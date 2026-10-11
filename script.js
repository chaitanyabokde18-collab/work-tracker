const STORAGE_KEY = 'work-tracker-v1';

const sampleState = {
  tasks: [
    {
      id: crypto.randomUUID(),
      title: 'Deep work sprint',
      date: todayISO(),
      start: '09:00',
      end: '11:00',
      category: 'Work',
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Email and planning',
      date: todayISO(),
      start: '14:00',
      end: '15:00',
      category: 'Personal',
      done: true,
    },
  ],
  workouts: [
    {
      id: crypto.randomUUID(),
      activity: 'Morning run',
      date: todayISO(),
      minutes: 35,
      type: 'Cardio',
    },
  ],
};

const state = loadState();

const elements = {
  taskForm: document.querySelector('#work-form'),
  taskTitle: document.querySelector('#task-title'),
  taskDate: document.querySelector('#task-date'),
  taskStart: document.querySelector('#task-start'),
  taskEnd: document.querySelector('#task-end'),
  taskCategory: document.querySelector('#task-category'),
  exerciseForm: document.querySelector('#exercise-form'),
  exerciseName: document.querySelector('#exercise-name'),
  exerciseMinutes: document.querySelector('#exercise-minutes'),
  exerciseType: document.querySelector('#exercise-type'),
  taskList: document.querySelector('#task-list'),
  exerciseList: document.querySelector('#exercise-list'),
  todayLabel: document.querySelector('#today-label'),
  todayLabelSmall: document.querySelector('#today-label-small'),
  taskCount: document.querySelector('#task-count'),
  doneCount: document.querySelector('#done-count'),
  exerciseMinutesTotal: document.querySelector('#exercise-minutes-total'),
  focusScore: document.querySelector('#focus-score'),
};

initialize();

function initialize() {
  elements.taskDate.value = todayISO();
  elements.taskForm.addEventListener('submit', handleTaskSubmit);
  elements.exerciseForm.addEventListener('submit', handleExerciseSubmit);
  render();
}

function handleTaskSubmit(event) {
  event.preventDefault();

  const title = elements.taskTitle.value.trim();
  if (!title) {
    elements.taskTitle.focus();
    return;
  }

  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    date: elements.taskDate.value || todayISO(),
    start: elements.taskStart.value || '09:00',
    end: elements.taskEnd.value || '10:00',
    category: elements.taskCategory.value,
    done: false,
  });

  saveState();
  elements.taskForm.reset();
  elements.taskDate.value = todayISO();
  render();
}

function handleExerciseSubmit(event) {
  event.preventDefault();

  const activity = elements.exerciseName.value.trim();
  const minutes = Number(elements.exerciseMinutes.value);

  if (!activity || !minutes) {
    elements.exerciseName.focus();
    return;
  }

  state.workouts.unshift({
    id: crypto.randomUUID(),
    activity,
    date: todayISO(),
    minutes,
    type: elements.exerciseType.value,
  });

  saveState();
  elements.exerciseForm.reset();
  render();
}

function render() {
  renderOverview();
  renderTasks();
  renderWorkouts();
}

function renderOverview() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.done).length;
  const totalMinutes = state.workouts.reduce((total, workout) => total + Number(workout.minutes || 0), 0);
  const focusScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  elements.taskCount.textContent = totalTasks;
  elements.doneCount.textContent = completedTasks;
  elements.exerciseMinutesTotal.textContent = `${totalMinutes} min`;
  elements.focusScore.textContent = `${focusScore}%`;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  elements.todayLabel.textContent = formattedDate;
  elements.todayLabelSmall.textContent = formattedDate;
}

function renderTasks() {
  const tasks = [...state.tasks].sort((a, b) => {
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
            <span class="badge ${task.category.toLowerCase() === 'work' ? 'work' : task.category.toLowerCase() === 'exercise' ? 'exercise' : 'personal'}">${escapeHtml(task.category)}</span>
            <button class="icon-btn" type="button" data-action="delete-task" data-id="${task.id}" aria-label="Delete ${task.title}">✕</button>
          </div>
        </li>
      `,
    )
    .join('');

  elements.taskList.querySelectorAll('[data-action="toggle-task"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const taskId = checkbox.dataset.id;
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) return;
      task.done = checkbox.checked;
      saveState();
      render();
    });
  });

  elements.taskList.querySelectorAll('[data-action="delete-task"]').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.id;
      state.tasks = state.tasks.filter((task) => task.id !== taskId);
      saveState();
      render();
    });
  });
}

function renderWorkouts() {
  const workouts = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date));

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
      state.workouts = state.workouts.filter((workout) => workout.id !== workoutId);
      saveState();
      render();
    });
  });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(sampleState);
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
    };
  } catch (error) {
    return structuredClone(sampleState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
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
