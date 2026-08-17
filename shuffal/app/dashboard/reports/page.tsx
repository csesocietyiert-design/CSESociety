'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export default function ReportsPage() {
  const router = useRouter();

  const reportRows = [
    { label: 'Total Members', value: 245 },
    { label: 'Verified Members', value: 198 },
    { label: 'Pending Approval', value: 47 },
    { label: 'Events', value: 18 },
  ];

  const exportToJSON = () => {
    const payload = { generatedAt: new Date().toISOString(), report: reportRows };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cse-society-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportRows.map((row) => ({
      Label: row.label,
      Value: row.value,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `cse-society-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('CSE Society Report', 14, 18);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 26);

    let y = 40;
    reportRows.forEach((row) => {
      pdf.text(`${row.label}: ${row.value}`, 14, y);
      y += 8;
    });

    pdf.save(`cse-society-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-md">
          <div className="mb-6 flex flex-wrap gap-2.5">
            <button
              onClick={exportToJSON}
              className="min-w-[92px] rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-gradient-to-r hover:from-white/20 hover:to-sky-200/10 hover:shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
            >
              <span className="mr-1.5">📄</span>JSON
            </button>
            <button
              onClick={exportToExcel}
              className="min-w-[92px] rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-gradient-to-r hover:from-white/20 hover:to-emerald-200/10 hover:shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
            >
              <span className="mr-1.5">📊</span>Excel
            </button>
            <button
              onClick={exportToPDF}
              className="min-w-[92px] rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-gradient-to-r hover:from-white/20 hover:to-rose-200/10 hover:shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
            >
              <span className="mr-1.5">📕</span>PDF
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reportRows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-left"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{row.label}</p>
                <p className="mt-3 text-2xl font-bold text-white">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
