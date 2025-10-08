import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Clock, BookOpen, Award } from 'lucide-react';
import { statsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchDashboardData();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await statsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await statsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Track your learning progress and performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Quizzes Taken"
          value={stats?.quizzesTaken || 0}
          icon={BookOpen}
          color="blue"
          subtitle="Total quizzes completed"
        />
        <StatCard
          title="Average Score"
          value={`${stats?.avgScore || 0}%`}
          icon={Target}
          color="green"
          subtitle="Overall performance"
        />
        <StatCard
          title="Total Attempts"
          value={stats?.totalAttempts || 0}
          icon={Clock}
          color="purple"
          subtitle="Practice sessions"
        />
        <StatCard
          title="Best Score"
          value={`${dashboardData?.performance?.bestScore || 0}%`}
          icon={Award}
          color="yellow"
          subtitle="Personal best"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {dashboardData?.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {activity.type === 'quiz' ? 'Quiz created' : 'Quiz attempted'} • {' '}
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Start taking quizzes to see your progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Topic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-green-600">Topic Strengths</h3>
            <p className="text-sm text-gray-500">Areas where you excel</p>
          </div>
          <div className="p-6">
            {stats?.topicStrengths?.length > 0 ? (
              <div className="space-y-3">
                {stats.topicStrengths.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{topic.topic}</p>
                      <p className="text-xs text-gray-500">{topic.attempts} attempts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{topic.avgScore}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Complete more quizzes to see your strengths</p>
            )}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-red-600">Areas for Improvement</h3>
            <p className="text-sm text-gray-500">Topics to focus on</p>
          </div>
          <div className="p-6">
            {stats?.topicWeaknesses?.length > 0 ? (
              <div className="space-y-3">
                {stats.topicWeaknesses.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{topic.topic}</p>
                      <p className="text-xs text-gray-500">{topic.attempts} attempts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">{topic.avgScore}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Great job! No weak areas identified</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Chart Placeholder */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Progress Over Time</h3>
          <p className="text-sm text-gray-500">Your performance trends</p>
        </div>
        <div className="p-6">
          {stats?.progressHistory?.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Progress chart would be displayed here</p>
                <p className="text-sm text-gray-400">
                  {stats.progressHistory.length} data points available
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No progress data yet</p>
              <p className="text-sm">Complete quizzes to track your progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
