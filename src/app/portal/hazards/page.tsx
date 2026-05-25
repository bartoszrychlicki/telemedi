"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { apiFetch, deleteJson, patchJson, postJson } from "@/lib/client-api";
import { validateRequired } from "@/lib/form-validation";
import {
  hazardCategoryLabels,
  hazardCategoryOrder,
} from "@/components/telemedi/format";
import { EmptyState, ErrorState, Field, LoadingState, Modal } from "@/components/telemedi/ui";
import type { Hazard, HazardCategory } from "@/components/telemedi/types";

export default function HazardsPage() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [active, setActive] = useState<HazardCategory>("PHYSICAL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Hazard | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setHazards(await apiFetch<Hazard[]>("/api/hazards"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hazards.filter(
      (hazard) =>
        hazard.category === active &&
        (!q || hazard.name.toLowerCase().includes(q)),
    );
  }, [hazards, active, query]);

  const systemHazards = visible.filter((hazard) => hazard.isSystem);
  const companyHazards = visible.filter((hazard) => !hazard.isSystem);

  async function remove(hazard: Hazard) {
    if (!confirm(`Usunąć czynnik "${hazard.name}"?`)) {
      return;
    }
    setError("");
    try {
      await deleteJson(`/api/hazards/${hazard.id}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">Czynniki narażeń</h1>
          <p className="page-sub">
            Prosty katalog czynników systemowych i firmowych używanych w skierowaniach.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} />
          Dodaj czynnik
        </button>
      </div>

      <div className="card">
        <div className="row between">
          <div className="row">
            {hazardCategoryOrder.map((category) => (
              <button
                className={`btn btn-sm ${active === category ? "btn-primary" : "btn-outline"}`}
                key={category}
                onClick={() => setActive(category)}
              >
                {hazardCategoryLabels[category]}
              </button>
            ))}
          </div>
          <div className="search-wrap" style={{ width: 360 }}>
            <Search size={18} />
            <input
              className="input"
              placeholder="Szukaj czynnika"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {loading ? <div className="mt-4"><LoadingState /></div> : null}

      {!loading ? (
        <section className="grid-2 mt-4">
          <HazardSection
            title="Czynniki systemowe Telemedi"
            hazards={systemHazards}
            readonly
          />
          <HazardSection
            title="Czynniki firmowe"
            hazards={companyHazards}
            onEdit={setEditing}
            onDelete={remove}
          />
        </section>
      ) : null}

      {showAdd ? (
        <HazardModal
          category={active}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            void load();
          }}
        />
      ) : null}
      {editing ? (
        <EditHazardModal
          hazard={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function HazardSection({
  title,
  hazards,
  readonly,
  onEdit,
  onDelete,
}: {
  title: string;
  hazards: Hazard[];
  readonly?: boolean;
  onEdit?: (hazard: Hazard) => void;
  onDelete?: (hazard: Hazard) => void;
}) {
  return (
    <div className="card">
      <div className="row between">
        <h2 className="t-lg bold">{title}</h2>
        <span className="badge badge-outline">{hazards.length}</span>
      </div>
      <div className="col mt-4">
        {hazards.length === 0 ? <EmptyState>Brak czynników w tej kategorii.</EmptyState> : null}
        {hazards.map((hazard) => (
          <div className="row between rounded-md border border-[var(--border)] p-3" key={hazard.id}>
            <span className={`hzd-chip ${hazard.isSystem ? "" : "company"}`}>
              {hazard.name}
            </span>
            {!readonly ? (
              <div className="row gap-sm">
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit?.(hazard)}>
                  <Pencil size={16} />
                </button>
                <button className="btn btn-ghost btn-sm danger" onClick={() => onDelete?.(hazard)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function HazardModal({
  category,
  onClose,
  onSaved,
}: {
  category: HazardCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [names, setNames] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setError("");
    if (pending) return;

    const parsedNames = names
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);

    const validationError = parsedNames.length
      ? null
      : "Uzupełnij wymagane pole: Nazwy czynników.";

    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      await postJson("/api/hazards", {
        category,
        names: parsedNames,
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title="Dodaj czynniki firmowe"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" disabled={pending} onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" disabled={pending} onClick={submit}>
            {pending ? "Dodawanie..." : "Dodaj"}
          </button>
        </>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <Field label={`Kategoria: ${hazardCategoryLabels[category]}`} help="Każdy czynnik wpisz w osobnej linii." required>
        <textarea
          className="textarea"
          required
          value={names}
          onChange={(event) => setNames(event.target.value)}
          placeholder={"np.\nKontakt z klejem przemysłowym\nPraca w komorze chłodniczej"}
        />
      </Field>
    </Modal>
  );
}

function EditHazardModal({
  hazard,
  onClose,
  onSaved,
}: {
  hazard: Hazard;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(hazard.name);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (pending) return;
    setError("");

    const validationError = validateRequired([{ label: "Nazwa czynnika", value: name }]);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      await patchJson(`/api/hazards/${hazard.id}`, { name });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title="Edytuj czynnik firmowy"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" disabled={pending} onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" disabled={pending} onClick={submit}>
            {pending ? "Zapisywanie..." : "Zapisz"}
          </button>
        </>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <Field label="Nazwa czynnika" required>
        <input className="input" required value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
    </Modal>
  );
}
