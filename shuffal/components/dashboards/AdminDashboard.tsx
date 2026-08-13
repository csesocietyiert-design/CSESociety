'use client';

export default function AdminDashboard({ user }: any) {
  const stats = [
    { label: 'Total Members', value: '324', icon: '👥' },
    { label: 'Active Events', value: '8', icon: '📅' },
    { label: 'Pending Approvals', value: '12', icon: '⏳' },
    { label: 'Total Certificates', value: '156', icon: '🏆' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h2>
        <p className="text-slate-400">Manage CSE Society operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card-gradient rounded-lg p-6 hover:bg-slate-700/50 transition cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-gradient rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {[
              { action: 'New member registered', user: 'John Doe', time: '2 hours ago' },
              { action: 'Event created', user: 'Tech Secretary', time: '4 hours ago' },
              { action: 'Certificate issued', user: 'Admin', time: '1 day ago' },
              { action: 'Member approved', user: 'Faculty', time: '2 days ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div>
                  <p className="text-sm text-slate-300">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.user}</p>
                </div>
                <p className="text-xs text-slate-500">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-gradient rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">
              Create Event
            </button>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">
              Send Notification
            </button>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">
              Approve Members
            </button>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
