import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = "https://study-task-hub1.onrender.com";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('tasks');
  const [theme, setTheme] = useState('Midnight Blue');
  
  // Data States
  const [tasks, setTasks] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Task Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [filterPriority, setFilterPriority] = useState('All');

  // Timetable Form State
  const [classDay, setClassDay] = useState('Monday');
  const [classTime, setClassTime] = useState('');
  const [classSubject, setClassSubject] = useState('');
  const [classRoom, setClassRoom] = useState('');

  // Pomodoro Timer State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('Work');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      fetchAllData();
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      setTasks([]);
      setTimetable([]);
      setSessions([]);
    }
  }, [token]);

  const fetchAllData = async () => {
    try {
      const [tasksRes, timetableRes, sessionsRes] = await Promise.all([
        axios.get(`${API_URL}/tasks`),
        axios.get(`${API_URL}/timetable`),
        axios.get(`${API_URL}/sessions`)
      ]);
      setTasks(tasksRes.data);
      setTimetable(timetableRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  // Pomodoro Timer Effect
  useEffect(() => {
    let timer;
    if (isTimerRunning && pomodoroTime > 0) {
      timer = setInterval(() => setPomodoroTime((prev) => prev - 1), 1000);
    } else if (pomodoroTime === 0) {
      if (timerMode === 'Work') {
        alert('Focus session complete! 25 mins logged to your study stats.');
        logStudySession(25);
      } else {
        alert('Break over! Back to work.');
      }
      const nextMode = timerMode === 'Work' ? 'Break' : 'Work';
      setTimerMode(nextMode);
      setPomodoroTime(nextMode === 'Work' ? 25 * 60 : 5 * 60);
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, pomodoroTime, timerMode]);

  const logStudySession = async (duration) => {
    try {
      const res = await axios.post(`${API_URL}/sessions`, { durationMinutes: duration });
      setSessions([...sessions, res.data]);
    } catch (err) {
      console.error('Error logging session', err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      if (isRegistering) {
        alert('Registration successful! Please log in.');
        setIsRegistering(false);
      } else {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userEmail', res.data.email);
        setToken(res.data.token);
        setUserEmail(res.data.email);
      }
    } catch (err) {
      setAuthError(err.response?.data?.msg || err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken('');
    setUserEmail('');
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/tasks`, {
        title,
        subject: subject || 'General',
        priority,
        deadline,
        notes
      });
      setTasks([res.data, ...tasks]);
      setTitle('');
      setSubject('');
      setDeadline('');
      setNotes('');
      setPriority('Medium');
    } catch (err) {
      console.error('Error adding task', err);
    }
  };

  const toggleTaskComplete = async (id, currentStatus) => {
    try {
      const res = await axios.put(`${API_URL}/tasks/${id}`, { completed: !currentStatus });
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)));
    } catch (err) {
      console.error('Error updating task', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!classSubject.trim() || !classTime.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/timetable`, {
        day: classDay,
        time: classTime,
        subject: classSubject,
        room: classRoom
      });
      setTimetable([...timetable, res.data]);
      setClassSubject('');
      setClassTime('');
      setClassRoom('');
    } catch (err) {
      console.error('Error adding timetable slot', err);
    }
  };

  const deleteClass = async (id) => {
    try {
      await axios.delete(`${API_URL}/timetable/${id}`);
      setTimetable(timetable.filter((item) => item._id !== id));
    } catch (err) {
      console.error('Error deleting timetable slot', err);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Study & Task Hub</h2>
          <p>{isRegistering ? 'Create your account' : 'Log in to your workspace'}</p>
          {authError && <div className="auth-error">{authError}</div>}
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary">{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <p className="auth-switch" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </p>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  }).sort((a, b) => {
    if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'Priority') {
      const weights = { High: 3, Medium: 2, Low: 1 };
      return weights[b.priority] - weights[a.priority];
    }
    return 0;
  });

  const totalTasks = tasks.length;
  const finishedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((finishedTasks / totalTasks) * 100) : 0;
  
  // Calculate total focus minutes today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = sessions
    .filter(s => s.date === todayStr)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div className={`app-container theme-${theme.toLowerCase().replace(/\s+/g, '-')}`}>
      <header className="app-header">
        <div className="brand-section">
          <h1>Study & Task Hub</h1>
          <nav className="nav-links">
            <span className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>Tasks & Notes</span>
            <span className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}>Weekly Timetable</span>
            <span className={activeTab === 'pomodoro' ? 'active' : ''} onClick={() => setActiveTab('pomodoro')}>Pomodoro Focus</span>
          </nav>
        </div>
        <div className="user-controls">
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="theme-selector">
            <option>Midnight Blue</option>
            <option>Emerald Dark</option>
            <option>Sunset Violet</option>
          </select>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'tasks' && (
          <div className="tasks-view">
            <div className="dashboard-grid">
              <div className="card overview-card">
                <h3>Productivity Overview</h3>
                <div className="stats-row">
                  <div><span>{totalTasks}</span> Total</div>
                  <div><span>{finishedTasks}</span> Finished</div>
                  <div><span>{todayMinutes}m</span> Focus Today</div>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              <div className="card mini-pomodoro">
                <h3>🍅 Pomodoro ({timerMode})</h3>
                <div className="timer-display">
                  {String(Math.floor(pomodoroTime / 60)).padStart(2, '0')}:
                  {String(pomodoroTime % 60).padStart(2, '0')}
                </div>
                <div className="timer-actions">
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="btn-accent">
                    {isTimerRunning ? 'Pause' : 'Start Focus'}
                  </button>
                  <button onClick={() => { setIsTimerRunning(false); setPomodoroTime(25 * 60); setTimerMode('Work'); }} className="btn-secondary">Reset</button>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddTask} className="task-form card">
              <input type="text" placeholder="Task title..." value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input type="text" placeholder="Subject / Category" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
              <button type="submit" className="btn-primary">Add Task</button>
            </form>

            <div className="filter-bar">
              <input
                type="text"
                placeholder="🔍 Search tasks or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="Newest">Sort by: Newest</option>
                <option value="Oldest">Sort by: Oldest</option>
                <option value="Priority">Sort by: Priority</option>
              </select>
            </div>

            <div className="task-list">
              {filteredTasks.length === 0 ? (
                <p className="no-tasks">No tasks found. Time to add some goals!</p>
              ) : (
                filteredTasks.map((task) => (
                  <div key={task._id} className={`task-card card ${task.completed ? 'completed' : ''}`}>
                    <div className="task-info">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskComplete(task._id, task.completed)}
                      />
                      <div>
                        <h4>{task.title}</h4>
                        <span className="task-meta">{task.subject} • Due: {task.deadline || 'No deadline'} • <span className={`priority-${task.priority.toLowerCase()}`}>{task.priority}</span></span>
                        {task.notes && <p className="task-notes">📝 {task.notes}</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteTask(task._id)} className="btn-delete">×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className="timetable-container">
            <form onSubmit={handleAddClass} className="task-form card">
              <select value={classDay} onChange={(e) => setClassDay(e.target.value)}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="text" placeholder="Time (e.g. 09:00 AM)" value={classTime} onChange={(e) => setClassTime(e.target.value)} required />
              <input type="text" placeholder="Subject Name" value={classSubject} onChange={(e) => setClassSubject(e.target.value)} required />
              <input type="text" placeholder="Room / Link (Optional)" value={classRoom} onChange={(e) => setClassRoom(e.target.value)} />
              <button type="submit" className="btn-primary">Add Class</button>
            </form>

            <div className="timetable-view card">
              <h2>📅 Weekly Timetable</h2>
              <div className="timetable-grid">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const dayClasses = timetable.filter(item => item.day === day);
                  return (
                    <div key={day} className="day-column">
                      <h3>{day}</h3>
                      {dayClasses.length === 0 ? (
                        <div className="day-slot">No classes</div>
                      ) : (
                        dayClasses.map((cls) => (
                          <div key={cls._id} className="class-item">
                            <div>
                              <strong>{cls.subject}</strong>
                              <span className="class-time">{cls.time} {cls.room && `• ${cls.room}`}</span>
                            </div>
                            <button onClick={() => deleteClass(cls._id)} className="class-delete">×</button>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pomodoro' && (
          <div className="pomodoro-full-view card">
            <h2>🍅 Pomodoro Focus Session</h2>
            <p>Boost your productivity with timed intervals. Completed sessions automatically log to your study stats!</p>
            <div className="big-timer">
              {String(Math.floor(pomodoroTime / 60)).padStart(2, '0')}:
              {String(pomodoroTime % 60).padStart(2, '0')}
            </div>
            <div className="pomodoro-controls">
              <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="btn-primary">
                {isTimerRunning ? 'Pause Timer' : 'Start Focus'}
              </button>
              <button onClick={() => { setIsTimerRunning(false); setPomodoroTime(25 * 60); setTimerMode('Work'); }} className="btn-secondary">
                Reset Timer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}