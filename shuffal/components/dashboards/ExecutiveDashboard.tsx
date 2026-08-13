'use client';

export default function ExecutiveDashboard({ user }: any) {
  const stats = [
    { label: 'Team Members', value: '24', icon: '👥' },
    { label: 'Events Organized', value: '16', icon: '📅' },
    { label: 'Registrations', value: '287', icon: '📝' },
    { label: 'Attendance Rate', value: '89%', icon: '✓' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Executive Dashboard</h2>
        <p className="text-slate-400">Manage and oversee society operations</p>
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
          <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
          <div className="space-y-2">
            {['Vice President', 'General Secretary', 'Technical Secretary', 'Cultural Secretary'].map((role, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <span className="text-sm text-slate-300">{role}</span>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-gradient rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Events Conducted</span>
              <span className="text-white font-medium">4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Attendees</span>
              <span className="text-white font-medium">324</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Notifications Sent</span>
              <span className="text-white font-medium">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
