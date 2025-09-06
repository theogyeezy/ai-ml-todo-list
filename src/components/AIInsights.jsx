import React from 'react';

function AIInsights({ todos, totalTime }) {
  const incompleteTodos = todos.filter(todo => !todo.completed);
  
  const getCategoryStats = () => {
    const stats = {};
    incompleteTodos.forEach(todo => {
      stats[todo.category] = (stats[todo.category] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  };

  const getPriorityStats = () => {
    const stats = { urgent: 0, high: 0, normal: 0, low: 0 };
    incompleteTodos.forEach(todo => {
      if (todo.priority?.level) {
        stats[todo.priority.level]++;
      }
    });
    return stats;
  };

  const getSentimentOverview = () => {
    if (incompleteTodos.length === 0) return 'neutral';
    const avgScore = incompleteTodos.reduce((sum, todo) => 
      sum + (todo.sentiment?.score || 0), 0) / incompleteTodos.length;
    
    if (avgScore > 1) return { mood: 'positive', emoji: '😊', message: 'Great vibes today!' };
    if (avgScore < -1) return { mood: 'stressful', emoji: '😰', message: 'Challenging tasks ahead' };
    return { mood: 'balanced', emoji: '😌', message: 'Balanced workload' };
  };

  const categoryStats = getCategoryStats();
  const priorityStats = getPriorityStats();
  const sentimentOverview = getSentimentOverview();

  if (incompleteTodos.length === 0) {
    return null;
  }

  return (
    <div className="ai-insights">
      <h3>🧠 AI Insights</h3>
      <div className="insights-grid">
        <div className="insight-card">
          <h4>📊 Categories</h4>
          <div className="category-list">
            {categoryStats.slice(0, 3).map(([category, count]) => (
              <div key={category} className="stat-item">
                <span>{category}:</span>
                <span className="stat-value">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="insight-card">
          <h4>🚨 Priority Overview</h4>
          <div className="priority-bars">
            {priorityStats.urgent > 0 && (
              <div className="priority-bar urgent">
                Urgent: {priorityStats.urgent}
              </div>
            )}
            {priorityStats.high > 0 && (
              <div className="priority-bar high">
                High: {priorityStats.high}
              </div>
            )}
            {priorityStats.normal > 0 && (
              <div className="priority-bar normal">
                Normal: {priorityStats.normal}
              </div>
            )}
            {priorityStats.low > 0 && (
              <div className="priority-bar low">
                Low: {priorityStats.low}
              </div>
            )}
          </div>
        </div>

        <div className="insight-card">
          <h4>😊 Mood Analysis</h4>
          <div className="mood-display">
            <span className="mood-emoji">{sentimentOverview.emoji}</span>
            <span className="mood-text">{sentimentOverview.message}</span>
          </div>
        </div>

        <div className="insight-card">
          <h4>⏰ Time Estimate</h4>
          <div className="time-display">
            <span className="time-total">{totalTime}</span>
            <span className="time-label">to complete all tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIInsights;