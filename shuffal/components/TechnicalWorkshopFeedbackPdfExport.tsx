'use client';

import { useState } from 'react';

interface FeedbackResponse {
  society_id: string;
  overall_rating: number;
  content_rating: number;
  speaker_rating: number;
  organization_rating: number;
  highlight: string;
  suggestions: string | null;
  created_at: string;
}

interface FeedbackPayload {
  responses: FeedbackResponse[];
}

function isFeedbackResponse(value: unknown): value is FeedbackResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return typeof response.society_id === 'string'
    && typeof response.overall_rating === 'number'
    && typeof response.content_rating === 'number'
    && typeof response.speaker_rating === 'number'
    && typeof response.organization_rating === 'number'
    && typeof response.highlight === 'string'
    && (typeof response.suggestions === 'string' || response.suggestions === null)
    && typeof response.created_at === 'string';
}

function isFeedbackPayload(value: unknown): value is FeedbackPayload {
  if (!value || typeof value !== 'object' || !('responses' in value) || !Array.isArray(value.responses)) {
    return false;
  }
  return value.responses.every(isFeedbackResponse);
}

function getErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value) || typeof value.error !== 'string') {
    return null;
  }
  return value.error;
}

export default function TechnicalWorkshopFeedbackPdfExport() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const downloadPdf = async () => {
    setBusy(true);
    setMessage('');
    setHasError(false);
    try {
      const response = await fetch('/api/technical-workshop-feedback/responses', { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(payload) || 'Could not load feedback responses.');
      }
      if (!isFeedbackPayload(payload)) {
        throw new Error('The feedback response data is invalid.');
      }
      if (payload.responses.length === 0) {
        setMessage('No feedback responses are available yet.');
        return;
      }

      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const margin = 14;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      const writeParagraph = (text: string, fontSize = 10, bold = false) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.5 + 1.5;
        const blockHeight = lines.length * lineHeight;
        if (y + blockHeight > pageHeight - margin) {
          pdf.addPage();
          y = 18;
        }
        pdf.text(lines, margin, y);
        y += blockHeight + 3;
      };

      writeParagraph('CSE Society - Technical Workshop Feedback', 16, true);
      writeParagraph(`Total responses: ${payload.responses.length}`);
      writeParagraph(`Exported: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      y += 3;

      payload.responses.forEach((entry, index) => {
        if (y + 28 > pageHeight - margin) {
          pdf.addPage();
          y = 18;
        }
        writeParagraph(`Response ${index + 1}  |  Society ID: ${entry.society_id}`, 12, true);
        writeParagraph(`Submitted: ${new Date(entry.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        writeParagraph(
          `Ratings (1-5): Overall ${entry.overall_rating}  |  Content ${entry.content_rating}  |  Speaker ${entry.speaker_rating}  |  Organization ${entry.organization_rating}`,
        );
        writeParagraph(`Most useful part: ${entry.highlight}`);
        writeParagraph(`Suggestions: ${entry.suggestions || 'None provided'}`);
        pdf.setDrawColor(190);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 7;
      });

      const pageCount = pdf.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      }

      pdf.save(`technical-workshop-feedback-${new Date().toISOString().slice(0, 10)}.pdf`);
      setMessage(`Downloaded PDF with ${payload.responses.length} responses.`);
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : 'Could not create the feedback PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => void downloadPdf()}
        disabled={busy}
        aria-label="Download all technical workshop feedback responses as PDF"
        title="Download all feedback responses as PDF"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-sky-300/30 bg-sky-300/10 text-sky-100 transition hover:border-sky-200 hover:bg-sky-300/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 disabled:cursor-wait disabled:opacity-50"
      >
        {busy ? (
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-sky-100/30 border-t-sky-100" />
        ) : (
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v4h14v-4M7 3h7l4 4v3" />
          </svg>
        )}
      </button>
      {message && <p role={hasError ? 'alert' : 'status'} className={`max-w-56 text-right text-xs ${hasError ? 'text-rose-200' : 'text-sky-100'}`}>{message}</p>}
    </div>
  );
}
