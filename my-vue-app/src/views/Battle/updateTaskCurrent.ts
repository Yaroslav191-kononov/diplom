interface DailyTask {
  id: number;
  title: string;
  desc: string;
  target: number;
  current: number;
  icon: string;
}

export function updateTaskCurrent(
  taskTitle: string,
  value: number = 1
): void {
  let dailyTasks=JSON.parse(localStorage.getItem('daily_tasks'));
  const task: DailyTask | undefined =
    dailyTasks.find(
      (t: DailyTask) => t.title === taskTitle
    );
  // если задание не найдено
  if (!task) return;

  // увеличиваем current
  task.current += value;

  // current не может быть больше target
  if (task.current > task.target) {
    task.current = task.target;
  }

  // current не может быть меньше 0
  if (task.current < 0) {
    task.current = 0;
  }

  // сохраняем в localStorage
  localStorage.setItem(
    'daily_tasks',
    JSON.stringify(dailyTasks)
  );
}