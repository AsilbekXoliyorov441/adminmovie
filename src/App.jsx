// App.jsx
import React, { useMemo, useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * ✅ Minimalistic Admin Panel (React + Tailwind) — Single File (App.jsx)
 * CRUD: GET list, POST create, PATCH edit, DELETE remove
 *
 * Base URL:
 * https://x8ki-letl-twmt.n7.xano.io/api:j6hO02gL
 *
 * Resources implemented:
 * - actor
 * - category
 * - director
 *
 * Tailwind kerak bo‘ladi (Vite + Tailwind).
 */

const XANO_BASE = "https://x8ki-letl-twmt.n7.xano.io/api:j6hO02gL";
const API_BASE = import.meta.env.DEV ? "/xano" : XANO_BASE;

// ---------- small utils ----------
const cx = (...a) => a.filter(Boolean).join(" ");

function toSlug(str = "") {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Xano sometimes returns {} on DELETE; handle gracefully
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

// ---------- UI primitives ----------
function TopBar({ title }) {
  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900" />
          <div>
            <div className="text-sm text-zinc-500">Xano Admin</div>
            <div className="text-base font-semibold text-zinc-900">{title}</div>
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          Base: <span className="font-mono">{API_BASE}</span>
        </div>
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "rounded-xl border px-3 py-2 text-sm transition",
            active === t.key
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2">
      <div
        className={cx(
          "rounded-2xl border p-3 shadow-lg",
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-zinc-200 bg-white text-zinc-900",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.message ? (
              <div className="mt-1 text-sm opacity-90">{toast.message}</div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-transparent px-2 py-1 text-sm hover:border-zinc-200 hover:bg-white/60"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="text-base font-semibold text-zinc-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-2 py-1 text-sm hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      Loading...
    </div>
  );
}

// ---------- Field components ----------
function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options = [], placeholder }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
      >
        <option value="">{placeholder ?? "Select..."}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <div className="text-sm text-zinc-700">{label}</div>
      <button
        onClick={() => onChange(!checked)}
        className={cx(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-zinc-900" : "bg-zinc-200",
        )}
        type="button"
      >
        <span
          className={cx(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}

// ---------- Generic Resource Page ----------
function ResourcePage({ resource }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(() => resource.makeEmpty());

  const showToast = (t) => {
    setToast(t);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2600);
  };

  const listQueryKey = ["resource-list", resource.key];
  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () => apiFetch(resource.paths.list),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const lookupDefs = resource.lookups ?? [];
  const lookupQueries = useQueries({
    queries: lookupDefs.map((l) => ({
      queryKey: ["resource-lookup", resource.key, l.key],
      queryFn: () => apiFetch(l.path),
      select: (data) => (Array.isArray(data) ? data : []),
    })),
  });

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const lookups = Object.fromEntries(
    lookupDefs.map((l, i) => [l.key, lookupQueries[i]?.data ?? []]),
  );
  const lookupsLoading = lookupQueries.some((q) => q.isLoading);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      resource.searchKeys.some((k) =>
        String(r?.[k] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, query, resource.searchKeys]);

  const saveMutation = useMutation({
    mutationFn: async ({ payload, itemMode, id }) => {
      if (itemMode === "create") {
        return apiFetch(resource.paths.create, {
          method: "POST",
          body: payload,
        });
      }
      if (!resource.paths.update) {
        throw new Error("Update endpoint is not configured for this resource");
      }
      return apiFetch(resource.paths.update(id), {
        method: "PATCH",
        body: payload,
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id) =>
      apiFetch(resource.paths.remove(id), { method: "DELETE" }),
  });

  const openCreate = () => {
    setMode("create");
    setCurrent(null);
    setForm(resource.makeEmpty());
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setCurrent(row);
    setForm(resource.makeFromRow(row));
    setModalOpen(true);
  };

  const submit = async () => {
    const payload = resource.toPayload(form);

    // very light validation (only required fields)
    const missing = resource.requiredFields.filter((f) => {
      const v = payload?.[f];
      return v === undefined || v === null || String(v).trim() === "";
    });
    if (missing.length) {
      showToast({
        type: "error",
        title: "Validation error",
        message: `Required: ${missing.join(", ")}`,
      });
      return;
    }

    try {
      await saveMutation.mutateAsync({
        payload,
        itemMode: mode,
        id: current?.id,
      });
      showToast({
        type: "success",
        title: mode === "create" ? "Created" : "Updated",
        message: "Saved",
      });
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
      setModalOpen(false);
    } catch (e) {
      showToast({ type: "error", title: "Save failed", message: e.message });
    }
  };

  const remove = async (row) => {
    const ok = window.confirm(
      `Delete "${resource.rowTitle(row)}"?\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    try {
      await removeMutation.mutateAsync(row.id);
      showToast({ type: "success", title: "Deleted", message: "Removed" });
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
    } catch (e) {
      showToast({ type: "error", title: "Delete failed", message: e.message });
    }
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: listQueryKey });
    await Promise.all(
      lookupDefs.map((l) =>
        queryClient.invalidateQueries({
          queryKey: ["resource-lookup", resource.key, l.key],
        }),
      ),
    );
  };

  return (
    <div className="grid gap-4">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-zinc-900">
              {resource.label}
            </div>
            <div className="text-sm text-zinc-500">
              {resource.paths.update
                ? "CRUD: GET / POST / PATCH / DELETE"
                : "CRUD: GET / POST / DELETE"}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4 sm:w-64"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <button
              onClick={openCreate}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              + Add
            </button>
            <button
              onClick={refresh}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="text-sm text-zinc-600">
          Total:{" "}
          <span className="font-semibold text-zinc-900">{rows.length}</span>
          {"  "}• Showing:{" "}
          <span className="font-semibold text-zinc-900">{filtered.length}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900">
          List
        </div>

        {listQuery.isLoading ? (
          <div className="p-4">
            <Spinner />
          </div>
        ) : listQuery.isError ? (
          <div className="p-4 text-sm text-rose-700">
            Load failed: {listQuery.error?.message || "Unknown error"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-zinc-600">No data found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  {resource.columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/60">
                    {resource.columns.map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        {c.render
                          ? c.render(row, lookups)
                          : String(row?.[c.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {resource.paths.update ? (
                          <button
                            onClick={() => openEdit(row)}
                            className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-white"
                          >
                            Edit
                          </button>
                        ) : null}
                        <button
                          onClick={() => remove(row)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={
          mode === "create" ? `Add ${resource.label}` : `Edit ${resource.label}`
        }
        onClose={() => setModalOpen(false)}
      >
        <div className="grid gap-4">
          {lookupsLoading ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              Loading related lists...
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {resource.renderForm({ form, setForm, lookups })}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              disabled={saveMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-medium text-white",
                saveMutation.isPending
                  ? "bg-zinc-400"
                  : "bg-zinc-900 hover:bg-zinc-800",
              )}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>

          {mode === "edit" && current?.id ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              ID: <span className="font-mono">{current.id}</span>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

// ---------- Resource configs ----------
function createResources() {
  return [
    {
      key: "actor",
      label: "Actors",
      paths: {
        list: "/actor",
        create: "/actor",
        update: (id) => `/actor/${id}`,
        remove: (id) => `/actor/${id}`,
      },
      columns: [
        {
          key: "photo_url",
          label: "Photo",
          render: (r) => (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                {/* if it’s base64 or url — <img> handles both */}
                {r.photo_url ? (
                  <img
                    src={r.photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <div className="max-w-[220px] truncate font-medium text-zinc-900">
                {r.full_name}
              </div>
            </div>
          ),
        },
        { key: "birth_year", label: "Birth Year" },
        { key: "country", label: "Country" },
        {
          key: "biography",
          label: "Bio",
          render: (r) => (
            <div className="max-w-[360px] truncate text-zinc-700">
              {r.biography}
            </div>
          ),
        },
      ],
      searchKeys: ["full_name", "country", "biography"],
      requiredFields: ["full_name"],
      rowTitle: (r) => r.full_name || r.id,
      makeEmpty: () => ({
        full_name: "",
        photo_url: "",
        birth_year: "",
        biography: "",
        country: "",
      }),
      makeFromRow: (r) => ({
        full_name: r.full_name ?? "",
        photo_url: r.photo_url ?? "",
        birth_year: r.birth_year ?? "",
        biography: r.biography ?? "",
        country: r.country ?? "",
      }),
      toPayload: (f) => ({
        full_name: String(f.full_name ?? "").trim(),
        photo_url: String(f.photo_url ?? "").trim(),
        birth_year:
          f.birth_year === "" ||
          f.birth_year === null ||
          f.birth_year === undefined
            ? 0
            : Number(f.birth_year),
        biography: String(f.biography ?? "").trim(),
        country: String(f.country ?? "").trim(),
      }),
      renderForm: ({ form, setForm }) => (
        <>
          <Input
            label="Full name *"
            value={form.full_name}
            onChange={(v) => setForm((p) => ({ ...p, full_name: v }))}
            placeholder="e.g. Andrew Garfield"
          />
          <Input
            label="Photo URL / base64"
            value={form.photo_url}
            onChange={(v) => setForm((p) => ({ ...p, photo_url: v }))}
            placeholder="https://... or data:image/jpeg;base64,..."
          />
          <Input
            label="Birth year"
            type="number"
            value={form.birth_year}
            onChange={(v) => setForm((p) => ({ ...p, birth_year: v }))}
            placeholder="1983"
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(v) => setForm((p) => ({ ...p, country: v }))}
            placeholder="USA"
          />
          <div className="sm:col-span-2">
            <TextArea
              label="Biography"
              value={form.biography}
              onChange={(v) => setForm((p) => ({ ...p, biography: v }))}
              placeholder="Short bio..."
              rows={4}
            />
          </div>
        </>
      ),
    },

    {
      key: "category",
      label: "Categories",
      paths: {
        list: "/category",
        create: "/category",
        update: (id) => `/category/${id}`,
        remove: (id) => `/category/${id}`,
      },
      columns: [
        { key: "order_number", label: "Order" },
        {
          key: "name_uz",
          label: "Name (UZ)",
          render: (r) => (
            <div className="max-w-[240px] truncate font-medium text-zinc-900">
              {r.name_uz}
            </div>
          ),
        },
        { key: "name_ru", label: "Name (RU)" },
        { key: "name_en", label: "Name (EN)" },
        {
          key: "slug",
          label: "Slug",
          render: (r) => (
            <span className="rounded-lg bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">
              {r.slug}
            </span>
          ),
        },
        {
          key: "is_active",
          label: "Active",
          render: (r) => (
            <span
              className={cx(
                "rounded-full px-2 py-1 text-xs font-medium",
                r.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-600",
              )}
            >
              {r.is_active ? "Yes" : "No"}
            </span>
          ),
        },
      ],
      searchKeys: ["name_uz", "name_ru", "name_en", "slug"],
      requiredFields: ["name_uz", "slug"],
      rowTitle: (r) => r.name_uz || r.slug || r.id,
      makeEmpty: () => ({
        name_uz: "",
        name_ru: "",
        name_en: "",
        slug: "",
        order_number: 0,
        is_active: true,
        autoSlug: true,
      }),
      makeFromRow: (r) => ({
        name_uz: r.name_uz ?? "",
        name_ru: r.name_ru ?? "",
        name_en: r.name_en ?? "",
        slug: r.slug ?? "",
        order_number: r.order_number ?? 0,
        is_active: !!r.is_active,
        autoSlug: false,
      }),
      toPayload: (f) => ({
        name_uz: String(f.name_uz ?? "").trim(),
        name_ru: String(f.name_ru ?? "").trim(),
        name_en: String(f.name_en ?? "").trim(),
        slug: String(f.slug ?? "").trim(),
        order_number:
          f.order_number === "" ||
          f.order_number === null ||
          f.order_number === undefined
            ? 0
            : Number(f.order_number),
        is_active: !!f.is_active,
      }),
      renderForm: ({ form, setForm }) => (
        <>
          <Input
            label="Name (UZ) *"
            value={form.name_uz}
            onChange={(v) =>
              setForm((p) => {
                const next = { ...p, name_uz: v };
                if (p.autoSlug) next.slug = toSlug(v);
                return next;
              })
            }
            placeholder="Masalan: Komediya"
          />
          <Input
            label="Slug *"
            value={form.slug}
            onChange={(v) =>
              setForm((p) => ({ ...p, slug: toSlug(v), autoSlug: false }))
            }
            placeholder="komediya"
          />

          <Input
            label="Name (RU)"
            value={form.name_ru}
            onChange={(v) => setForm((p) => ({ ...p, name_ru: v }))}
            placeholder="Комедия"
          />
          <Input
            label="Name (EN)"
            value={form.name_en}
            onChange={(v) => setForm((p) => ({ ...p, name_en: v }))}
            placeholder="Comedy"
          />

          <Input
            label="Order number"
            type="number"
            value={form.order_number}
            onChange={(v) => setForm((p) => ({ ...p, order_number: v }))}
            placeholder="0"
          />

          <div className="grid gap-2">
            <Toggle
              label="Is active"
              checked={!!form.is_active}
              onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              <div className="font-medium text-zinc-800">Auto-slug</div>
              <div className="mt-1">
                Name (UZ) yozganda slug avtomatik to‘ladi. Slugni qo‘lda
                o‘zgartirsangiz, auto o‘chadi.
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    autoSlug: true,
                    slug: toSlug(p.name_uz),
                  }))
                }
                className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
              >
                Re-enable auto-slug
              </button>
            </div>
          </div>
        </>
      ),
    },

    {
      key: "director",
      label: "Directors",
      paths: {
        list: "/director",
        create: "/director",
        update: (id) => `/director/${id}`,
        remove: (id) => `/director/${id}`,
      },
      columns: [
        {
          key: "photo_url",
          label: "Photo",
          render: (r) => (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                {r.photo_url ? (
                  <img
                    src={r.photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <div className="max-w-[240px] truncate font-medium text-zinc-900">
                {r.full_name}
              </div>
            </div>
          ),
        },
        { key: "country", label: "Country" },
        {
          key: "biography",
          label: "Bio",
          render: (r) => (
            <div className="max-w-[420px] truncate text-zinc-700">
              {r.biography}
            </div>
          ),
        },
      ],
      searchKeys: ["full_name", "country", "biography"],
      requiredFields: ["full_name"],
      rowTitle: (r) => r.full_name || r.id,
      makeEmpty: () => ({
        full_name: "",
        photo_url: "",
        biography: "",
        country: "",
      }),
      makeFromRow: (r) => ({
        full_name: r.full_name ?? "",
        photo_url: r.photo_url ?? "",
        biography: r.biography ?? "",
        country: r.country ?? "",
      }),
      toPayload: (f) => ({
        full_name: String(f.full_name ?? "").trim(),
        photo_url: String(f.photo_url ?? "").trim(),
        biography: String(f.biography ?? "").trim(),
        country: String(f.country ?? "").trim(),
      }),
      renderForm: ({ form, setForm }) => (
        <>
          <Input
            label="Full name *"
            value={form.full_name}
            onChange={(v) => setForm((p) => ({ ...p, full_name: v }))}
            placeholder="e.g. Steven Spielberg"
          />
          <Input
            label="Photo URL / base64"
            value={form.photo_url}
            onChange={(v) => setForm((p) => ({ ...p, photo_url: v }))}
            placeholder="https://... or data:image/jpeg;base64,..."
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(v) => setForm((p) => ({ ...p, country: v }))}
            placeholder="USA"
          />
          <div className="sm:col-span-2">
            <TextArea
              label="Biography"
              value={form.biography}
              onChange={(v) => setForm((p) => ({ ...p, biography: v }))}
              placeholder="Short bio..."
              rows={4}
            />
          </div>
        </>
      ),
    },

    {
      key: "genre",
      label: "Genres",
      paths: {
        list: "/genre",
        create: "/genre",
        update: (id) => `/genre/${id}`,
        remove: (id) => `/genre/${id}`,
      },
      columns: [
        { key: "name_uz", label: "Name (UZ)" },
        { key: "name_ru", label: "Name (RU)" },
        { key: "name_en", label: "Name (EN)" },
        {
          key: "slug",
          label: "Slug",
          render: (r) => (
            <span className="rounded-lg bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">
              {r.slug}
            </span>
          ),
        },
        { key: "icon", label: "Icon" },
        {
          key: "is_active",
          label: "Active",
          render: (r) => (
            <span
              className={cx(
                "rounded-full px-2 py-1 text-xs font-medium",
                r.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-600",
              )}
            >
              {r.is_active ? "Yes" : "No"}
            </span>
          ),
        },
      ],
      searchKeys: ["name_uz", "name_ru", "name_en", "slug", "icon"],
      requiredFields: ["name_uz", "slug"],
      rowTitle: (r) => r.name_uz || r.slug || r.id,
      makeEmpty: () => ({
        name_uz: "",
        name_ru: "",
        name_en: "",
        slug: "",
        icon: "",
        is_active: true,
        autoSlug: true,
      }),
      makeFromRow: (r) => ({
        name_uz: r.name_uz ?? "",
        name_ru: r.name_ru ?? "",
        name_en: r.name_en ?? "",
        slug: r.slug ?? "",
        icon: r.icon ?? "",
        is_active: !!r.is_active,
        autoSlug: false,
      }),
      toPayload: (f) => ({
        name_uz: String(f.name_uz ?? "").trim(),
        name_ru: String(f.name_ru ?? "").trim(),
        name_en: String(f.name_en ?? "").trim(),
        slug: String(f.slug ?? "").trim(),
        icon: String(f.icon ?? "").trim(),
        is_active: !!f.is_active,
      }),
      renderForm: ({ form, setForm }) => (
        <>
          <Input
            label="Name (UZ) *"
            value={form.name_uz}
            onChange={(v) =>
              setForm((p) => {
                const next = { ...p, name_uz: v };
                if (p.autoSlug) next.slug = toSlug(v);
                return next;
              })
            }
            placeholder="Masalan: Drama"
          />
          <Input
            label="Slug *"
            value={form.slug}
            onChange={(v) =>
              setForm((p) => ({ ...p, slug: toSlug(v), autoSlug: false }))
            }
            placeholder="drama"
          />
          <Input
            label="Name (RU)"
            value={form.name_ru}
            onChange={(v) => setForm((p) => ({ ...p, name_ru: v }))}
            placeholder="Drama"
          />
          <Input
            label="Name (EN)"
            value={form.name_en}
            onChange={(v) => setForm((p) => ({ ...p, name_en: v }))}
            placeholder="Drama"
          />
          <Input
            label="Icon"
            value={form.icon}
            onChange={(v) => setForm((p) => ({ ...p, icon: v }))}
            placeholder="bi bi-film"
          />
          <div className="grid gap-2">
            <Toggle
              label="Is active"
              checked={!!form.is_active}
              onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  autoSlug: true,
                  slug: toSlug(p.name_uz),
                }))
              }
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
            >
              Re-enable auto-slug
            </button>
          </div>
        </>
      ),
    },

    {
      key: "movie",
      label: "Movies",
      paths: {
        list: "/movie",
        create: "/movie",
        update: (id) => `/movie/${id}`,
        remove: (id) => `/movie/${id}`,
      },
      columns: [
        {
          key: "poster_url",
          label: "Poster",
          render: (r) => (
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
              {r.poster_url ? (
                <img
                  src={r.poster_url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </div>
          ),
        },
        {
          key: "title_uz",
          label: "Title (UZ)",
          render: (r) => (
            <div className="max-w-[220px] truncate font-medium text-zinc-900">
              {r.title_uz}
            </div>
          ),
        },
        { key: "release_year", label: "Year" },
        { key: "imdb_rating", label: "IMDB" },
        { key: "duration_minutes", label: "Duration" },
        {
          key: "is_active",
          label: "Active",
          render: (r) => (r.is_active ? "Yes" : "No"),
        },
      ],
      searchKeys: ["title_uz", "title_ru", "title_en", "country", "language"],
      requiredFields: ["title_uz"],
      rowTitle: (r) => r.title_uz || r.title_en || r.id,
      makeEmpty: () => ({
        title_uz: "",
        title_ru: "",
        title_en: "",
        description_uz: "",
        description_ru: "",
        description_en: "",
        poster_url: "",
        banner_url: "",
        trailer_url: "",
        video_url: "",
        duration_minutes: 0,
        release_year: 0,
        imdb_rating: 0,
        age_rating: "",
        country: "",
        language: "",
        is_premium: false,
        is_featured: false,
        view_count: 0,
        updated_at: 0,
        is_active: true,
        created_by: 0,
      }),
      makeFromRow: (r) => ({
        title_uz: r.title_uz ?? "",
        title_ru: r.title_ru ?? "",
        title_en: r.title_en ?? "",
        description_uz: r.description_uz ?? "",
        description_ru: r.description_ru ?? "",
        description_en: r.description_en ?? "",
        poster_url: r.poster_url ?? "",
        banner_url: r.banner_url ?? "",
        trailer_url: r.trailer_url ?? "",
        video_url: r.video_url ?? "",
        duration_minutes: r.duration_minutes ?? 0,
        release_year: r.release_year ?? 0,
        imdb_rating: r.imdb_rating ?? 0,
        age_rating: r.age_rating ?? "",
        country: r.country ?? "",
        language: r.language ?? "",
        is_premium: !!r.is_premium,
        is_featured: !!r.is_featured,
        view_count: r.view_count ?? 0,
        updated_at: r.updated_at ?? 0,
        is_active: !!r.is_active,
        created_by: r.created_by ?? 0,
      }),
      toPayload: (f) => ({
        title_uz: String(f.title_uz ?? "").trim(),
        title_ru: String(f.title_ru ?? "").trim(),
        title_en: String(f.title_en ?? "").trim(),
        description_uz: String(f.description_uz ?? "").trim(),
        description_ru: String(f.description_ru ?? "").trim(),
        description_en: String(f.description_en ?? "").trim(),
        poster_url: String(f.poster_url ?? "").trim(),
        banner_url: String(f.banner_url ?? "").trim(),
        trailer_url: String(f.trailer_url ?? "").trim(),
        video_url: String(f.video_url ?? "").trim(),
        duration_minutes:
          f.duration_minutes === "" ||
          f.duration_minutes === null ||
          f.duration_minutes === undefined
            ? 0
            : Number(f.duration_minutes),
        release_year:
          f.release_year === "" ||
          f.release_year === null ||
          f.release_year === undefined
            ? 0
            : Number(f.release_year),
        imdb_rating:
          f.imdb_rating === "" || f.imdb_rating === null || f.imdb_rating === undefined
            ? 0
            : Number(f.imdb_rating),
        age_rating: String(f.age_rating ?? "").trim(),
        country: String(f.country ?? "").trim(),
        language: String(f.language ?? "").trim(),
        is_premium: !!f.is_premium,
        is_featured: !!f.is_featured,
        view_count:
          f.view_count === "" || f.view_count === null || f.view_count === undefined
            ? 0
            : Number(f.view_count),
        updated_at:
          f.updated_at === "" || f.updated_at === null || f.updated_at === undefined
            ? 0
            : Number(f.updated_at),
        is_active: !!f.is_active,
        created_by:
          f.created_by === "" || f.created_by === null || f.created_by === undefined
            ? 0
            : Number(f.created_by),
      }),
      renderForm: ({ form, setForm }) => (
        <>
          <Input
            label="Title (UZ) *"
            value={form.title_uz}
            onChange={(v) => setForm((p) => ({ ...p, title_uz: v }))}
            placeholder="Masalan: Interstellar"
          />
          <Input
            label="Title (RU)"
            value={form.title_ru}
            onChange={(v) => setForm((p) => ({ ...p, title_ru: v }))}
            placeholder="Interstellar"
          />
          <Input
            label="Title (EN)"
            value={form.title_en}
            onChange={(v) => setForm((p) => ({ ...p, title_en: v }))}
            placeholder="Interstellar"
          />
          <Input
            label="Poster URL"
            value={form.poster_url}
            onChange={(v) => setForm((p) => ({ ...p, poster_url: v }))}
            placeholder="https://..."
          />
          <Input
            label="Banner URL"
            value={form.banner_url}
            onChange={(v) => setForm((p) => ({ ...p, banner_url: v }))}
            placeholder="https://..."
          />
          <Input
            label="Trailer URL"
            value={form.trailer_url}
            onChange={(v) => setForm((p) => ({ ...p, trailer_url: v }))}
            placeholder="https://youtube.com/..."
          />
          <Input
            label="Video URL"
            value={form.video_url}
            onChange={(v) => setForm((p) => ({ ...p, video_url: v }))}
            placeholder="https://..."
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={form.duration_minutes}
            onChange={(v) => setForm((p) => ({ ...p, duration_minutes: v }))}
            placeholder="120"
          />
          <Input
            label="Release year"
            type="number"
            value={form.release_year}
            onChange={(v) => setForm((p) => ({ ...p, release_year: v }))}
            placeholder="2024"
          />
          <Input
            label="IMDB rating"
            type="number"
            value={form.imdb_rating}
            onChange={(v) => setForm((p) => ({ ...p, imdb_rating: v }))}
            placeholder="8.2"
          />
          <Input
            label="Age rating"
            value={form.age_rating}
            onChange={(v) => setForm((p) => ({ ...p, age_rating: v }))}
            placeholder="PG-13"
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(v) => setForm((p) => ({ ...p, country: v }))}
            placeholder="USA"
          />
          <Input
            label="Language"
            value={form.language}
            onChange={(v) => setForm((p) => ({ ...p, language: v }))}
            placeholder="English"
          />
          <Input
            label="View count"
            type="number"
            value={form.view_count}
            onChange={(v) => setForm((p) => ({ ...p, view_count: v }))}
            placeholder="0"
          />
          <Input
            label="Updated at (number)"
            type="number"
            value={form.updated_at}
            onChange={(v) => setForm((p) => ({ ...p, updated_at: v }))}
            placeholder="0"
          />
          <Input
            label="Created by (number)"
            type="number"
            value={form.created_by}
            onChange={(v) => setForm((p) => ({ ...p, created_by: v }))}
            placeholder="0"
          />
          <div className="grid gap-2">
            <Toggle
              label="Premium"
              checked={!!form.is_premium}
              onChange={(v) => setForm((p) => ({ ...p, is_premium: v }))}
            />
            <Toggle
              label="Featured"
              checked={!!form.is_featured}
              onChange={(v) => setForm((p) => ({ ...p, is_featured: v }))}
            />
            <Toggle
              label="Is active"
              checked={!!form.is_active}
              onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Description (UZ)"
              value={form.description_uz}
              onChange={(v) => setForm((p) => ({ ...p, description_uz: v }))}
              placeholder="Qisqa tavsif..."
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Description (RU)"
              value={form.description_ru}
              onChange={(v) => setForm((p) => ({ ...p, description_ru: v }))}
              placeholder="Opisanie..."
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Description (EN)"
              value={form.description_en}
              onChange={(v) => setForm((p) => ({ ...p, description_en: v }))}
              placeholder="Short description..."
              rows={3}
            />
          </div>
        </>
      ),
    },

    {
      key: "movie_actor",
      label: "Movie Actors",
      lookups: [
        { key: "movies", path: "/movie" },
        { key: "actors", path: "/actor" },
      ],
      paths: {
        list: "/movie_actor",
        create: "/movie_actor",
        update: (id) => `/movie_actor/${id}`,
        remove: (id) => `/movie_actor/${id}`,
      },
      columns: [
        {
          key: "movie_id",
          label: "Movie",
          render: (r, lookups) => {
            const m = (lookups.movies ?? []).find((x) => x.id === r.movie_id);
            return m?.title_uz || m?.title_en || r.movie_id;
          },
        },
        {
          key: "actor_id",
          label: "Actor",
          render: (r, lookups) => {
            const a = (lookups.actors ?? []).find((x) => x.id === r.actor_id);
            return a?.full_name || r.actor_id;
          },
        },
        { key: "role", label: "Role" },
      ],
      searchKeys: ["movie_id", "actor_id", "role"],
      requiredFields: ["movie_id", "actor_id"],
      rowTitle: (r) => r.role || r.id,
      makeEmpty: () => ({
        movie_id: "",
        actor_id: "",
        role: "",
      }),
      makeFromRow: (r) => ({
        movie_id: r.movie_id ?? "",
        actor_id: r.actor_id ?? "",
        role: r.role ?? "",
      }),
      toPayload: (f) => ({
        movie_id: String(f.movie_id ?? "").trim(),
        actor_id: String(f.actor_id ?? "").trim(),
        role: String(f.role ?? "").trim(),
      }),
      renderForm: ({ form, setForm, lookups }) => (
        <>
          <SelectInput
            label="Movie *"
            value={form.movie_id}
            onChange={(v) => setForm((p) => ({ ...p, movie_id: v }))}
            placeholder="Select movie"
            options={(lookups.movies ?? []).map((m) => ({
              value: m.id,
              label: m.title_uz || m.title_en || m.id,
            }))}
          />
          <SelectInput
            label="Actor *"
            value={form.actor_id}
            onChange={(v) => setForm((p) => ({ ...p, actor_id: v }))}
            placeholder="Select actor"
            options={(lookups.actors ?? []).map((a) => ({
              value: a.id,
              label: a.full_name || a.id,
            }))}
          />
          <Input
            label="Role"
            value={form.role}
            onChange={(v) => setForm((p) => ({ ...p, role: v }))}
            placeholder="Lead, Supporting..."
          />
        </>
      ),
    },

    {
      key: "movie_category",
      label: "Movie Categories",
      lookups: [
        { key: "movies", path: "/movie" },
        { key: "categories", path: "/category" },
      ],
      paths: {
        list: "/movie_category",
        create: "/movie_category",
        update: (id) => `/movie_category/${id}`,
        remove: (id) => `/movie_category/${id}`,
      },
      columns: [
        {
          key: "movie_id",
          label: "Movie",
          render: (r, lookups) => {
            const m = (lookups.movies ?? []).find((x) => x.id === r.movie_id);
            return m?.title_uz || m?.title_en || r.movie_id;
          },
        },
        {
          key: "category_id",
          label: "Category",
          render: (r, lookups) => {
            const c = (lookups.categories ?? []).find(
              (x) => x.id === r.category_id,
            );
            return c?.name_uz || c?.name_en || c?.slug || r.category_id;
          },
        },
      ],
      searchKeys: ["movie_id", "category_id"],
      requiredFields: ["movie_id", "category_id"],
      rowTitle: (r) => r.id,
      makeEmpty: () => ({
        movie_id: "",
        category_id: "",
      }),
      makeFromRow: (r) => ({
        movie_id: r.movie_id ?? "",
        category_id: r.category_id ?? "",
      }),
      toPayload: (f) => ({
        movie_id: String(f.movie_id ?? "").trim(),
        category_id: String(f.category_id ?? "").trim(),
      }),
      renderForm: ({ form, setForm, lookups }) => (
        <>
          <SelectInput
            label="Movie *"
            value={form.movie_id}
            onChange={(v) => setForm((p) => ({ ...p, movie_id: v }))}
            placeholder="Select movie"
            options={(lookups.movies ?? []).map((m) => ({
              value: m.id,
              label: m.title_uz || m.title_en || m.id,
            }))}
          />
          <SelectInput
            label="Category *"
            value={form.category_id}
            onChange={(v) => setForm((p) => ({ ...p, category_id: v }))}
            placeholder="Select category"
            options={(lookups.categories ?? []).map((c) => ({
              value: c.id,
              label: c.name_uz || c.name_en || c.slug || c.id,
            }))}
          />
        </>
      ),
    },

    {
      key: "movie_director",
      label: "Movie Directors",
      paths: {
        list: "/movie_director",
        create: "/movie_director",
        update: (id) => `/movie_director/${id}`,
        remove: (id) => `/movie_director/${id}`,
      },
      columns: [
        { key: "movie_id", label: "Movie ID" },
        { key: "director_id", label: "Director ID" },
      ],
      searchKeys: ["movie_id", "director_id"],
      requiredFields: ["movie_id", "director_id"],
      rowTitle: (r) => r.id,
      makeEmpty: () => ({
        movie_id: "",
        director_id: "",
      }),
      makeFromRow: (r) => ({
        movie_id: r.movie_id ?? "",
        director_id: r.director_id ?? "",
      }),
      toPayload: (f) => ({
        movie_id: String(f.movie_id ?? "").trim(),
        director_id: String(f.director_id ?? "").trim(),
      }),
      renderForm: ({ form, setForm }) => (
        <>
          <Input
            label="Movie ID *"
            value={form.movie_id}
            onChange={(v) => setForm((p) => ({ ...p, movie_id: v }))}
            placeholder="UUID"
          />
          <Input
            label="Director ID *"
            value={form.director_id}
            onChange={(v) => setForm((p) => ({ ...p, director_id: v }))}
            placeholder="UUID"
          />
        </>
      ),
    },

    {
      key: "movie_genre",
      label: "Movie Genres",
      lookups: [
        { key: "movies", path: "/movie" },
        { key: "genres", path: "/genre" },
      ],
      paths: {
        list: "/movie_genre",
        create: "/movie_genre",
        update: (id) => `/movie_genre/${id}`,
        remove: (id) => `/movie_genre/${id}`,
      },
      columns: [
        {
          key: "movie_id",
          label: "Movie",
          render: (r, lookups) => {
            const m = (lookups.movies ?? []).find((x) => x.id === r.movie_id);
            return m?.title_uz || m?.title_en || r.movie_id;
          },
        },
        {
          key: "genre_id",
          label: "Genre",
          render: (r, lookups) => {
            const g = (lookups.genres ?? []).find((x) => x.id === r.genre_id);
            return g?.name_uz || g?.name_en || g?.slug || r.genre_id;
          },
        },
      ],
      searchKeys: ["movie_id", "genre_id"],
      requiredFields: ["movie_id", "genre_id"],
      rowTitle: (r) => r.id,
      makeEmpty: () => ({
        movie_id: "",
        genre_id: "",
      }),
      makeFromRow: (r) => ({
        movie_id: r.movie_id ?? "",
        genre_id: r.genre_id ?? "",
      }),
      toPayload: (f) => ({
        movie_id: String(f.movie_id ?? "").trim(),
        genre_id: String(f.genre_id ?? "").trim(),
      }),
      renderForm: ({ form, setForm, lookups }) => (
        <>
          <SelectInput
            label="Movie *"
            value={form.movie_id}
            onChange={(v) => setForm((p) => ({ ...p, movie_id: v }))}
            placeholder="Select movie"
            options={(lookups.movies ?? []).map((m) => ({
              value: m.id,
              label: m.title_uz || m.title_en || m.id,
            }))}
          />
          <SelectInput
            label="Genre *"
            value={form.genre_id}
            onChange={(v) => setForm((p) => ({ ...p, genre_id: v }))}
            placeholder="Select genre"
            options={(lookups.genres ?? []).map((g) => ({
              value: g.id,
              label: g.name_uz || g.name_en || g.slug || g.id,
            }))}
          />
        </>
      ),
    },
  ];
}

// ---------- App ----------
export default function App() {
  const resources = useMemo(() => createResources(), []);
  const tabs = resources.map((r) => ({ key: r.key, label: r.label }));
  const [active, setActive] = useState(resources[0]?.key ?? "actor");

  const activeResource =
    resources.find((r) => r.key === active) || resources[0];

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopBar title="Admin Panel" />

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-zinc-500">Sections</div>
              <div className="text-lg font-semibold text-zinc-900">
                Manage data (CRUD)
              </div>
            </div>
            <Tabs tabs={tabs} active={active} onChange={setActive} />
          </div>

          <div className="mt-3 text-sm text-zinc-600">
            Tip: Xano’da auth yo‘q bo‘lsa ham ishlaydi. Agar keyin “admin-only”
            endpoint qo‘shsang, shu joyga token header qo‘shamiz.
          </div>
        </div>

        <ResourcePage resource={activeResource} />

        <footer className="pb-10 text-center text-xs text-zinc-500">
          Built in a single <span className="font-mono">App.jsx</span> • React +
          Tailwind
        </footer>
      </main>
    </div>
  );
}

