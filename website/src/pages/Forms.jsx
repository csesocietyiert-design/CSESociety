import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, FileText, Share2 } from "lucide-react";
import "./Forms.css";

const dashboardOrigin = import.meta.env.VITE_FORMS_DASHBOARD_URL?.replace(/\/+$/, "")
  || (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);
const formsApiUrl = import.meta.env.DEV ? "/api/forms" : `${dashboardOrigin}/api/forms`;

export default function Forms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [eventOpen, setEventOpen] = useState(null);

  const handleShare = async (form) => {
    const url = form.shareUrl || `${dashboardOrigin}/forms/${encodeURIComponent(form.id)}`;
    setShareMessage("");

    try {
      if (navigator.share) {
        await navigator.share({ title: form.title, url });
        setShareMessage(`Shared "${form.title}".`);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMessage("Form link copied to clipboard.");
      } else {
        throw new Error("Sharing or clipboard access is not available in this browser.");
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      setShareMessage(shareError instanceof Error ? shareError.message : "Could not share the form link.");
    }
  };

  useEffect(() => {
    const updateEventStatus = () => {
      setEventOpen(Date.now() < new Date("2026-11-01T09:00:00+05:30").getTime());
    };
    updateEventStatus();
    const timer = window.setInterval(updateEventStatus, 15000);
    let active = true;

    fetch(formsApiUrl, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Could not load registration forms.");
        }
        if (!Array.isArray(payload.forms)) {
          throw new Error("The registration forms response was invalid.");
        }
        return payload.forms;
      })
      .then((items) => {
        if (active) setForms(items);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load registration forms.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="forms-page">
      <header className="forms-brandbar">
        <img src={`${dashboardOrigin}/logo.png`} alt="CSE Society logo" />
        <div className="forms-brandbar-text">
          <strong>CSE Society</strong>
          <span>IERT Portal</span>
        </div>
      </header>
      <main className="forms-shell">
        <header className="forms-page-heading">
          <p className="forms-kicker">CSE Society</p>
          <h1>Registration Forms</h1>
          <p>Choose a form below to register for society activities and events.</p>
        </header>
        {shareMessage && <p className="forms-share-message" role="status">{shareMessage}</p>}

        <section className="forms-grid" aria-label="Available registration forms">
          <article className={`form-panel-card tone-2 ${eventOpen === false ? "is-closed" : ""}`}>
            <div className="form-card-head">
              <span className={`form-badge ${eventOpen === true ? "form-open" : eventOpen === false ? "form-closed" : ""}`}>
                {eventOpen === null ? "Checking" : eventOpen ? "Open" : "Closed"}
              </span>
            </div>
            <h2>E-Sports Swiss-League Tournament</h2>
            <ul className="form-meta">
              <li><Clock3 size={15} /> 1 Nov 2026 · Closes at 9:00 AM</li>
              <li>Auditorium · Trophies &amp; certificates</li>
            </ul>
            <div className="form-card-footer">
              <a className="panel-primary-btn" href={`${dashboardOrigin}/event-registration`} target="_blank" rel="noreferrer">
                {eventOpen === false ? "View event details" : "Register now"} <ArrowRight size={15} />
              </a>
              <button
                className="panel-share-btn"
                type="button"
                onClick={() => void handleShare({ title: "E-Sports Swiss-League Tournament", shareUrl: `${dashboardOrigin}/event-registration` })}
              >
                {shareMessage === 'Form link copied to clipboard.' || shareMessage.startsWith('Shared "E-Sports')
                  ? <Check size={15} />
                  : <Share2 size={15} />}
                Share
              </button>
            </div>
          </article>
          {loading && <p className="forms-message forms-grid-message" role="status">Loading other registration forms...</p>}
          {error && <p className="forms-message forms-error forms-grid-message" role="alert">{error}</p>}
          {!loading && !error && forms.length === 0 && (
            <p className="forms-message forms-grid-message">There are no other registration forms available right now.</p>
          )}
          {!loading && !error && forms.map((form, index) => {
              const isClosed = form.end_date < getIndiaDate();
              const formUrl = `${dashboardOrigin}/forms/${encodeURIComponent(form.id)}`;
              const documentUrl = `${formUrl}?document=1`;
              const endDate = new Date(`${form.end_date}T00:00:00`).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              });

              return (
                <article key={form.id} className={`form-panel-card tone-${index % 5} ${isClosed ? "is-closed" : ""}`}>
                  <div className="form-card-head">
                    <span className={`form-badge ${isClosed ? "form-closed" : "form-open"}`}>
                      {isClosed ? "Closed" : "Open"}
                    </span>
                    {form.document_url && (
                      <a
                        className="form-card-icon-link"
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open document for ${form.title}`}
                      >
                        <FileText className="form-card-icon" size={20} />
                      </a>
                    )}
                  </div>
                  <h2>{form.title}</h2>
                  <ul className="form-meta">
                    <li><Clock3 size={15} /> End date: {endDate}</li>
                  </ul>
                  <div className="form-card-footer">
                    <a className="panel-primary-btn" href={formUrl} target="_blank" rel="noreferrer">
                      {isClosed ? "View form status" : "Register now"} <ArrowRight size={15} />
                    </a>
                    <button className="panel-share-btn" type="button" onClick={() => void handleShare(form)}>
                      {shareMessage === `Shared "${form.title}".` || shareMessage === "Form link copied to clipboard."
                        ? <Check size={15} />
                        : <Share2 size={15} />}
                      Share
                    </button>
                  </div>
                </article>
              );
            })}
        </section>
      </main>
    </div>
  );
}

function getIndiaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
