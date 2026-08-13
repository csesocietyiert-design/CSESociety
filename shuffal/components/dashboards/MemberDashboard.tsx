'use client';

export default function MemberDashboard({ user }: any) {
  const stats = [
    { label: 'Events Attended', value: '12', icon: '📅' },
    { label: 'Certificates Earned', value: '5', icon: '🏆' },
    { label: 'My Society ID', value: user.cseId, icon: '🎫' },
    { label: 'Current Year', value: `Year ${user.year}`, icon: '📚' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome, {user.name}</h2>
        <p className="text-slate-400">Here's your CSE Society dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card-gradient rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-gradient rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Announcements</h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300">New event registration open</p>
              <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300">Certificates uploaded</p>
              <p className="text-xs text-slate-500 mt-1">1 day ago</p>
            </div>
          </div>
        </div>

        <div className="card-gradient rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300">Tech Workshop - Web Development</p>
              <p className="text-xs text-slate-500 mt-1">August 20, 2026</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300">Annual CSE Fest</p>
              <p className="text-xs text-slate-500 mt-1">September 15, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
