// CaretackerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSnackbar } from "notistack";
import ConfirmBox from "../../components/ConfirmBox";

const API_BASE = "https://itp-backend-waw1.onrender.com/api";

function broadcastAppointmentsChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent("appointments:changed", { detail }));
}

function getCaretakerName() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "Caretaker";
    const u = JSON.parse(raw);
    return u?.name || u?.fullName || "Caretaker";
  } catch {
    return "Caretaker";
  }
}

export default function CaretackerDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [q, setQ] = useState("");

  const now = new Date();
  const defaultYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [monthFilter, setMonthFilter] = useState("all");

  const { enqueueSnackbar } = useSnackbar();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRow, setPendingRow] = useState(null);
  const [pendingNext, setPendingNext] = useState(null);
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

  const toAmount = (obj) => {
    const n = Number(
      obj?.price ?? obj?.packagePrice ?? obj?.selectedPrice ?? obj?.amount ?? 0
    );
    return Number.isFinite(n) ? n : 0;
  };

  async function loadAll() {
    setLoading(true);
    try {
      const [gRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/grooming/all`),
        fetch(`${API_BASE}/daycare/all`),
      ]);
      const g = await gRes.json();
      const d = await dRes.json();

      const toHHMM = (m) => {
        if (m == null) return "";
        const h = Math.floor(m / 60);
        const mm = String(m % 60).padStart(2, "0");
        const h12 = ((h + 11) % 12) + 1;
        const ampm = h >= 12 ? "PM" : "AM";
        return `${String(h12).padStart(2, "0")}:${mm} ${ampm}`;
      };

      const groom = (Array.isArray(g) ? g : []).map((a) => ({
        _id: a._id,
        service: "grooming",
        ownerName: a.ownerName,
        ownerEmail: a.email || a.ownerEmail,
        ownerPhone: a.phone || a.ownerPhone,
        petType: a.petType,
        title: a.packageName || a.packageId || "Grooming",
        date: a.dateISO,
        time: toHHMM(a.timeSlotMinutes),
        status: a.status || "pending",
        paymentStatus: a.paymentStatus || "unpaid",
        amount: toAmount(a),
        notes: a.notes || a.specialNotes || "",
        createdAt: a.createdAt,
      }));

      const daycare = (Array.isArray(d) ? d : []).map((a) => ({
        _id: a._id,
        service: "daycare",
        ownerName: a.ownerName,
        ownerEmail: a.ownerEmail,
        ownerPhone: a.ownerPhone,
        petType: a.petType,
        title: a.packageName || a.packageId || "Daycare",
        date: a.dateISO,
        time: `${toHHMM(a.dropOffMinutes)}–${toHHMM(a.pickUpMinutes)}`,
        status: a.status || "pending",
        paymentStatus: a.paymentStatus || "unpaid",
        amount: toAmount(a),
        notes: a.notes || a.specialNotes || "",
        createdAt: a.createdAt,
      }));

      const merged = [...groom, ...daycare].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRows(merged);
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Failed to load appointments.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const handler = () => loadAll();
    window.addEventListener("appointments:changed", handler);
    return () => window.removeEventListener("appointments:changed", handler);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (serviceFilter !== "all" && r.service !== serviceFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (paymentFilter !== "all" && (r.paymentStatus || "unpaid") !== paymentFilter) return false;
      if (monthFilter !== "all") {
        const ymd = (r.date || "").slice(0, 7) || (r.createdAt || "").slice(0, 7);
        if (ymd !== monthFilter) return false;
      }
      if (q) {
        const hay = `${r.ownerName} ${r.ownerEmail || ""} ${r.ownerPhone || ""} ${r.title} ${r.petType} ${r.notes || ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, serviceFilter, statusFilter, paymentFilter, monthFilter, q]);

  async function updateStatus(row, nextStatus, reason = "") {
    try {
      const endpoint =
        row.service === "grooming"
          ? `${API_BASE}/grooming/${row._id}/status`
          : `${API_BASE}/daycare/${row._id}/status`;

      const payload = {
        status: nextStatus,
        caretakerName: getCaretakerName?.() || "Caretaker",
        ...(nextStatus === "rejected" ? { rejectionReason: reason || "" } : {}),
      };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await res.json() : await res.text();

      if (!res.ok) {
        const msg =
          typeof body === "string"
            ? body
            : body?.error || body?.message || `Request failed (${res.status})`;
        enqueueSnackbar(msg, { variant: "error" });
        return false;
      }

      setRows((prev) =>
        prev.map((r) =>
          r._id === row._id && r.service === row.service ? { ...r, status: nextStatus } : r
        )
      );
      enqueueSnackbar(`Marked as ${nextStatus}`, { variant: "success" });

      broadcastAppointmentsChanged({
        action: "status-changed",
        service: row.service,
        id: row._id,
        status: nextStatus,
      });

      return true;
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Network error", { variant: "error" });
      return false;
    }
  }

  function exportCaretakerPDF() {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      doc.setFontSize(16);
      doc.text("Caretaker Appointments Summary", 40, 40);

      doc.setFontSize(10);
      const appliedFilters = [
        serviceFilter !== "all" ? `Service: ${serviceFilter}` : "Service: All",
        statusFilter !== "all" ? `Status: ${statusFilter}` : "Status: All",
        paymentFilter !== "all" ? `Payment: ${paymentFilter}` : "Payment: All",
        monthFilter !== "all" ? `Month: ${monthFilter}` : "",
        q ? `Search: "${q}"` : "",
      ].filter(Boolean).join("   |   ");
      doc.text(appliedFilters || "All records", 40, 58);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 74);

      doc.text("PetPulse — 123 Paws Lane, Colombo 05", 40, 92);
      doc.text("Hotline: +94 77 123 4567  •  hello@petpulse.lk", 40, 108);

      const body = filtered.map((r) => [
        r.date || "-",
        r.time || "-",
        r.service,
        r.title || "-",
        r.petType || "-",
        r.ownerName || "-",
        r.ownerEmail || "-",
        r.ownerPhone || "-",
        r.status || "-",
        r.paymentStatus || "unpaid",
        (Number(r.amount) || 0).toFixed(2),
        r.notes ? String(r.notes) : "-",
      ]);

      autoTable(doc, {
        startY: 140,
        head: [[
          "Date","Time","Service","Package","Pet","Owner","Email","Phone","Status","Payment","Fee (Rs.)","Notes"
        ]],
        body,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
        headStyles: { fillColor: [16, 185, 129] },
        columnStyles: { 11: { cellWidth: 180 } },
        didDrawPage: () => {
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ?? pageSize.getHeight();
          const pageWidth = pageSize.width ?? pageSize.getWidth();
          doc.setFontSize(9);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 60, pageHeight - 20);
        },
      });

      doc.save("caretaker-appointments.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      enqueueSnackbar("Could not generate PDF. Check console for details.", { variant: "error" });
    }
  }

  const isActionDisabled = (r, next) =>
    (next === "accepted" && r.status === "accepted") ||
    (next === "rejected" && r.status === "rejected") ||
    confirmBusy;

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
        Care-taker Dashboard
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" title="Filter by service">
          <option value="all">All services</option>
          <option value="grooming">Grooming</option>
          <option value="daycare">Daycare</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" title="Filter by status">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" title="Filter by payment status">
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Month:</label>
          <input
            type="month"
            value={monthFilter === "all" ? defaultYYYYMM : monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            title="Filter by month"
          />
          {monthFilter !== "all" && (
            <button onClick={() => setMonthFilter("all")} className="text-xs underline text-slate-600 hover:text-slate-900">
              Clear
            </button>
          )}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search owner / phone / email / pet / package / notes…"
          className="rounded-lg border border-slate-300 px-3 py-2 flex-1 min-w-[220px]"
        />

        <button onClick={loadAll} className="rounded-lg bg-slate-800 text-white px-4 py-2 hover:bg-slate-900">
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-black/5 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Pet</th>
              <th className="px-4 py-3 text-left">Package</th>
              <th className="px-4 py-3 text-left">Date / Time</th>
              <th className="px-4 py-3 text-left">Notes</th>
              <th className="px-4 py-4 text-left">Payment</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-6 text-center">Loading…</td></tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-500">No bookings found.</td></tr>
            )}

            {!loading && filtered.map((r) => (
              <tr key={`${r.service}-${r._id}`} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-medium ${
                    r.service === "grooming" ? "bg-fuchsia-50 text-fuchsia-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {r.service}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{r.ownerName}</div>
                  <div className="text-slate-500">{r.ownerEmail || "-"}</div>
                  <div className="text-slate-500">{r.ownerPhone || "-"}</div>
                </td>

                <td className="px-4 py-3">{r.petType || "-"}</td>
                <td className="px-4 py-3">{r.title}</td>

                <td className="px-4 py-3">
                  <div>{r.date}</div>
                  <div className="text-slate-500">{r.time}</div>
                </td>

                <td className="px-4 py-3 max-w-[260px]">
                  <div
                    title={r.notes || ""}
                    className="text-slate-700 break-words"
                    style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {r.notes || "-"}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-medium ${
                      (r.paymentStatus || "unpaid") === "paid"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                    title={`Payment is ${r.paymentStatus || "unpaid"}`}
                  >
                    {r.paymentStatus || "unpaid"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-medium ${
                    r.status === "accepted"
                      ? "bg-green-50 text-green-700"
                      : r.status === "rejected"
                      ? "bg-rose-50 text-rose-700"
                      : r.status === "cancelled"
                      ? "bg-slate-100 text-slate-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {r.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => openConfirm(r, "accepted")}
                      disabled={(pendingNext === "accepted" && confirmBusy) || r.status === "accepted"}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => openConfirm(r, "rejected")}
                      disabled={(pendingNext === "rejected" && confirmBusy) || r.status === "rejected"}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <button
            onClick={exportCaretakerPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white font-semibold hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 16l4-5h-3V4h-2v7H8l4 5z" />
              <path d="M20 18H4v2h16v-2z" />
            </svg>
            Download Summary (PDF)
          </button>
        </div>
      </div>

      <ConfirmBox
        open={confirmOpen}
        title={pendingNext === "accepted" ? "Accept this booking?" : pendingNext === "rejected" ? "Reject this booking?" : "Confirm action"}
        message={
          pendingRow
            ? `${pendingRow.ownerName || "Owner"} • ${pendingRow.service.toUpperCase()} • ${pendingRow.date} ${pendingRow.time || ""}`
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
        onClose={() => { if (!confirmBusy) closeConfirm(); }}
      >
        {pendingNext === "rejected" ? (
          <div className="w-full">
            <label className="block text-sm text-slate-600 mb-1">Rejection reason (visible to customer):</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="e.g., Caretaker unavailable at selected time"
            />
          </div>
        ) : null}
      </ConfirmBox>
    </section>
  );
}
