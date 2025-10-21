// src/pages/doctor/DoctorDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSnackbar } from "notistack";
import ConfirmBox from "../../components/ConfirmBox";

const API_BASE = "https://itp-backend-waw1.onrender.com";

//
function broadcastAppointmentsChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent("appointments:changed", { detail }));
}

const getBookedAtMs = (x) =>
  x?.createdAt
    ? new Date(x.createdAt).getTime()
    : x?._id
    ? parseInt(x._id.substring(0, 8), 16) * 1000
    : 0;

const VIEW_FILTERS = [
  { value: "all", label: "All appointments" },
  { value: "pending", label: "Pending only" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "today", label: "Today" },
  { value: "next7", label: "Next 7 days" },
];

const PET_FILTERS = [
  { value: "all", label: "All pets" },
  { value: "Dog", label: "Dog" },
  { value: "Cat", label: "Cat" },
  { value: "Rabbit", label: "Rabbit" },
  { value: "Bird", label: "Bird" },
  { value: "Other", label: "Other" },
];

// HH:MM AM/PM from minutes since midnight
function minutesToLabel(m) {
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const h12 = ((h24 + 11) % 12) + 1;
  const ampm = h24 >= 12 ? "PM" : "AM";
  return `${String(h12).padStart(2, "0")}:${mm} ${ampm}`;
}

//signed-in doctor's display name
function getDoctorName() {
  return localStorage.getItem("doctorName") || "Doctor";
}

export default function DoctorDashboard() {
  const [items, setItems] = useState([]); //all vet appointments
  const [view, setView] = useState("all");
  const [petType, setPetType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  // confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRow, setPendingRow] = useState(null); //which row is being acted on
  const [pendingNext, setPendingNext] = useState(null); // "accepted" / "rejected"
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  function openConfirm(row, nextStatus) {
    setPendingRow(row);
    setPendingNext(nextStatus);
    setRejectReason("");
    setConfirmOpen(true);
  }
  function closeConfirm() {
    setConfirmOpen(false);
    setPendingRow(null);
    setPendingNext(null);
    setRejectReason("");
    setConfirmBusy(false);
  }

  // Load appointments
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/vet/all`);
        const ct = res.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await res.json() : await res.text();
        if (!res.ok) throw new Error(typeof data === "string" ? data : data?.error || "Failed");

        const normalized = (Array.isArray(data) ? data : []).sort((a, b) => {
          const aKey = `${a.dateISO || ""} ${String(a.timeSlotMinutes || 0).padStart(4, "0")}`;
          const bKey = `${b.dateISO || ""} ${String(b.timeSlotMinutes || 0).padStart(4, "0")}`;
          if (aKey !== bKey) return bKey.localeCompare(aKey);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        if (mounted) setItems(normalized);
      } catch (e) {
        if (mounted) setErr(String(e.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const todayYMD = new Date().toISOString().slice(0, 10);
  const inNext7 = (ymd) => {
    const d = new Date(ymd + "T00:00:00");
    const today = new Date(todayYMD + "T00:00:00");
    const diff = (d - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    //builds the list to show
    const base = items.filter((a) => {
      if (a.service && a.service !== "vet") return false;
      if (view === "pending" && a.status !== "pending") return false;
      if (view === "accepted" && a.status !== "accepted") return false;
      if (view === "rejected" && a.status !== "rejected") return false;
      if (view === "today" && a.dateISO !== todayYMD) return false;
      if (view === "next7" && !inNext7(a.dateISO)) return false;
      if (petType !== "all" && a.petType !== petType) return false;
      if (q && !(a.selectedService || "").toLowerCase().includes(q)) return false;
      return true;
    });

    //final sort by “booked at” (most recently booked first)
    return base.slice().sort((a, b) => getBookedAtMs(b) - getBookedAtMs(a));
  }, [items, view, petType, todayYMD, query]);

  // Accept/Reject — supports passing a row or id, and a rejection reason
  async function updateStatus(rowOrId, status, rejectionReason = "") {
    try {
      const id =
        typeof rowOrId === "string"
          ? rowOrId
          : (rowOrId && (rowOrId._id || rowOrId.id)) || "";

      if (!id) throw new Error("Invalid appointment id");

      const res = await fetch(
        `${API_BASE}/api/vet/${encodeURIComponent(String(id))}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            doctorName: getDoctorName(),
            rejectionReason: status === "rejected" ? rejectionReason : undefined,
          }),
        }
      );

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = typeof data === "string" ? data : data?.message || data?.error || "Failed";
        throw new Error(msg);
      }

      setItems((prev) => prev.map((it) => (it._id === id ? { ...it, status } : it)));
      enqueueSnackbar(`Marked as ${status}`, { variant: "success" });

      broadcastAppointmentsChanged({ action: "status-changed", service: "vet", id, status });
      return true;
    } catch (e) {
      enqueueSnackbar("Failed to update: " + String(e.message || e), { variant: "error" });
      return false;
    }
  }

  // ------------ PDF Generation ------------------------
  function exportDoctorPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Vet Appointments Summary", 40, 40);

    doc.setFontSize(11);
    const viewLabel = VIEW_FILTERS.find((v) => v.value === view)?.label || "All appointments";
    const petLabel = PET_FILTERS.find((p) => p.value === petType)?.label || "All pets";
    doc.text(`View: ${viewLabel}   |   Pet: ${petLabel}   |   Search: ${query || "—"}`, 40, 58);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 74);

    const addrY = 90;
    doc.setFontSize(10);
    doc.text("PetPulse — 123 Paws Lane, Colombo 05", 40, addrY);
    doc.text("Hotline: +94 77 123 4567  •  hello@petpulse.lk", 40, addrY + 14);

    //transform rows to table body
    const body = filtered.map((a) => [
      a.dateISO || "-",
      `${minutesToLabel(a.timeSlotMinutes)}–${minutesToLabel(
        (a.timeSlotMinutes || 0) + (a.durationMin || 30)
      )}`,
      a.selectedService || "Vet Consultation",
      a.petType || "-",
      a.ownerName || "-",
      a.ownerPhone || "-",
      a.paymentStatus || "unpaid",
      a.status || "pending",
    ]);

    autoTable(doc, {
      startY: addrY + 28,
      head: [["Date", "Time", "Package", "Pet", "Owner", "Phone", "Payment", "Status"]],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageW - 60,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    //--------- summary section ---------------
    const total = filtered.length;
    const acc = filtered.filter((a) => a.status === "accepted").length;
    const rej = filtered.filter((a) => a.status === "rejected").length;
    const pen = filtered.filter((a) => a.status === "pending").length;
    const can = filtered.filter((a) => a.status === "cancelled").length;
    const paid = filtered.filter((a) => (a.paymentStatus || "unpaid") === "paid").length;
    const unpaid = total - paid;

    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : addrY + 28;
    doc.setFontSize(12);
    doc.text("Summary", 40, y);
    doc.setFontSize(10);
    y += 16;
    doc.text(`Total appointments: ${total}`, 40, y);
    y += 14;
    doc.text(`By status: accepted ${acc}, rejected ${rej}, pending ${pen}, cancelled ${can}`, 40, y);
    y += 14;
    doc.text(`By payment: paid ${paid}, unpaid ${unpaid}`, 40, y);

    doc.save("vet-appointments-summary.pdf");
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Vet Doctor Dashboard</h1>
          <p className="text-slate-600">Review and manage veterinary appointments.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            aria-label="View filter"
          >
            {VIEW_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            aria-label="Pet type filter"
          >
            {PET_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by package name…"
            className="w-[320px] max-w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
            aria-label="Search by package name"
          />

          <button
            onClick={exportDoctorPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-semibold hover:bg-blue-700"
            title="Download current view as PDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 16l4-5h-3V4h-2v7H8l4 5z" />
              <path d="M20 18H4v2h16v-2z" />
            </svg>
            Download Summary (PDF)
          </button>
        </div>
      </header>

      {loading && <div className="text-slate-600">Loading appointments…</div>}
      {!loading && err && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 ring-1 ring-red-200">{err}</div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <div className="rounded-lg bg-slate-50 text-slate-700 px-4 py-6 ring-1 ring-slate-200">
          No appointments match this view.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((a) => (
          <article key={a._id} className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {a.selectedService || "Vet Consultation"}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    a.status === "accepted"
                      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                      : a.status === "rejected"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : a.status === "cancelled"
                      ? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  }`}
                >
                  {a.status || "pending"}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    (a.paymentStatus || "unpaid") === "paid"
                      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  }`}
                  title={`Payment is ${a.paymentStatus || "unpaid"}`}
                >
                  {a.paymentStatus || "unpaid"}
                </span>
              </div>
            </div>

            <dl className="mt-3 space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt className="font-medium">Date</dt>
                <dd>{a.dateISO}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Time</dt>
                <dd>
                  {minutesToLabel(a.timeSlotMinutes)} –{" "}
                  {minutesToLabel((a.timeSlotMinutes || 0) + (a.durationMin || 30))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Pet</dt>
                <dd>
                  {a.petType}
                  {a.petSize ? ` • ${a.petSize}` : ""}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Owner</dt>
                <dd>{a.ownerName}</dd>
              </div>
              {a.ownerEmail && (
                <div className="flex justify-between">
                  <dt className="font-medium">Email</dt>
                  <dd>{a.ownerEmail}</dd>
                </div>
              )}
              {a.ownerPhone && (
                <div className="flex justify-between">
                  <dt className="font-medium">Phone</dt>
                  <dd>{a.ownerPhone}</dd>
                </div>
              )}
            </dl>

            <p className="mt-3 text-sm text-slate-500 line-clamp-3" title={a.reason}>
              {a.reason}
            </p>

            {a.medicalFilePath && (
              <div className="mt-3 rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="font-medium">Medical record:</span>{" "}
                    <span className="text-slate-600">{a.medicalFilePath.split("/").pop()}</span>
                  </div>
                  <a
                    href={a.medicalFilePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-slate-800 text-white text-xs font-semibold px-3 py-2 hover:bg-black"
                    title="Open medical record in a new tab"
                  >
                    View
                  </a>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => openConfirm(a, "accepted")}
                disabled={a.status === "accepted"}
                className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                Accept
              </button>
              <button
                onClick={() => openConfirm(a, "rejected")}
                disabled={a.status === "rejected"}
                className="flex-1 rounded-lg bg-rose-600 text-white px-3 py-2 text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* ConfirmBox Modal with reason field for rejection */}
      <ConfirmBox
        open={confirmOpen}
        title={
          pendingNext === "accepted"
            ? "Accept this appointment?"
            : pendingNext === "rejected"
            ? "Reject this appointment?"
            : "Confirm action"
        }
        message={
          pendingRow
            ? `${pendingRow.ownerName || "Owner"} • ${pendingRow.dateISO || "-"} ${minutesToLabel(
                pendingRow.timeSlotMinutes || 0
              )}`
            : "Are you sure?"
        }
        confirmLabel={pendingNext === "rejected" ? "Reject" : "Accept"}
        cancelLabel="Keep"
        tone={pendingNext === "rejected" ? "danger" : "success"}
        loading={confirmBusy}
        onConfirm={async () => {
          if (!pendingRow || !pendingNext) return;
          if (pendingNext === "rejected" && !rejectReason.trim()) {
            enqueueSnackbar("Please provide a rejection reason.", { variant: "warning" });
            return;
          }
          setConfirmBusy(true);
          const ok = await updateStatus(pendingRow, pendingNext, rejectReason.trim());
          setConfirmBusy(false);
          if (ok) closeConfirm();
        }}
        onClose={() => {
          if (!confirmBusy) closeConfirm();
        }}
      >
        {pendingNext === "rejected" ? (
          <div className="w-full mt-3">
            <label className="block text-sm text-slate-600 mb-1">
              Rejection reason (visible to customer):
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="e.g., Doctor unavailable at selected time"
            />
          </div>
        ) : null}
      </ConfirmBox>
    </section>
  );
}
