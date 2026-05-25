"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";

import { apiFetch, deleteJson, patchJson, postJson } from "@/lib/client-api";
import { formatDate, hazardCategoryLabels } from "@/components/telemedi/format";
import { EmptyState, ErrorState, Field, LoadingState, Modal } from "@/components/telemedi/ui";
import type { Hazard, Template } from "@/components/telemedi/types";

type TemplateForm = {
  name: string;
  positionDescription: string;
  workDescription: string;
  hazardIds: string[];
};

const emptyForm: TemplateForm = {
  name: "",
  positionDescription: "",
  workDescription: "",
  hazardIds: [],
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [templateData, hazardData] = await Promise.all([
        apiFetch<Template[]>("/api/templates"),
        apiFetch<Hazard[]>("/api/hazards"),
      ]);
      setTemplates(templateData);
      setHazards(hazardData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(template: Template) {
    if (!confirm(`Usunąć szablon "${template.name}"?`)) {
      return;
    }
    setError("");
    try {
      await deleteJson(`/api/templates/${template.id}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function duplicate(template: Template) {
    setError("");
    try {
      await postJson("/api/templates", {
        name: `${template.name} - kopia`,
        positionDescription: template.positionDescription,
        workDescription: template.workDescription,
        hazardFactors: template.hazardFactors.map((item) => ({
          hazardFactorId: item.hazardFactorId,
          defaultExposureValue: item.defaultExposureValue,
          defaultMeasurementResult: item.defaultMeasurementResult,
        })),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">Szablony</h1>
          <p className="page-sub">
            Gotowe zestawy opisów stanowiska i czynników do szybkiego wystawiania skierowań.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          Nowy szablon
        </button>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState /> : null}

      {!loading && templates.length === 0 ? (
        <div className="card">
          <EmptyState>Nie masz jeszcze żadnych szablonów.</EmptyState>
        </div>
      ) : null}

      <section className="grid-2">
        {templates.map((template) => (
          <article className="card col" key={template.id}>
            <div className="row between">
              <div>
                <h2 className="t-lg bold">{template.name}</h2>
                <p className="muted t-sm">Utworzono {formatDate(template.createdAt)}</p>
              </div>
              <span className="badge badge-outline">
                {template.hazardFactors.length} czynników
              </span>
            </div>
            <p className="muted">
              {template.positionDescription ?? "Brak opisu stanowiska."}
            </p>
            <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
              {template.hazardFactors.slice(0, 6).map((item) => (
                <span className="hzd-chip" key={item.hazardFactorId}>
                  {item.hazardFactor.name}
                </span>
              ))}
            </div>
            <div className="row">
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(template)}>
                <Pencil size={16} />
                Edytuj
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => duplicate(template)}>
                <Copy size={16} />
                Duplikuj
              </button>
              <button className="btn btn-ghost btn-sm danger" onClick={() => remove(template)}>
                <Trash2 size={16} />
                Usuń
              </button>
            </div>
          </article>
        ))}
      </section>

      {showCreate ? (
        <TemplateModal
          hazards={hazards}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            void load();
          }}
        />
      ) : null}
      {editing ? (
        <TemplateModal
          hazards={hazards}
          template={editing}
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

function TemplateModal({
  hazards,
  template,
  onClose,
  onSaved,
}: {
  hazards: Hazard[];
  template?: Template;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = useMemo<TemplateForm>(() => {
    if (!template) {
      return emptyForm;
    }
    return {
      name: template.name,
      positionDescription: template.positionDescription ?? "",
      workDescription: template.workDescription ?? "",
      hazardIds: template.hazardFactors.map((item) => item.hazardFactorId),
    };
  }, [template]);
  const [form, setForm] = useState<TemplateForm>(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function toggleHazard(id: string) {
    setForm((current) => ({
      ...current,
      hazardIds: current.hazardIds.includes(id)
        ? current.hazardIds.filter((item) => item !== id)
        : [...current.hazardIds, id],
    }));
  }

  async function submit() {
    setPending(true);
    setError("");
    const payload = {
      name: form.name,
      positionDescription: form.positionDescription,
      workDescription: form.workDescription,
      hazardFactors: form.hazardIds.map((hazardId) => ({
        hazardFactorId: hazardId,
        defaultExposureValue: "zgodnie z oceną ryzyka zawodowego",
        defaultMeasurementResult: "brak aktualnego pomiaru / nie dotyczy",
      })),
    };

    try {
      if (template) {
        await patchJson(`/api/templates/${template.id}`, payload);
      } else {
        await postJson("/api/templates", payload);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title={template ? "Edytuj szablon" : "Nowy szablon"}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" disabled={pending} onClick={submit}>Zapisz</button>
        </>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <div className="grid-2">
        <Field label="Nazwa szablonu">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="field">
          <span className="label">Wybrane czynniki</span>
          <span className="badge badge-outline">{form.hazardIds.length}</span>
        </div>
      </div>
      <div className="grid-2 mt-4">
        <Field label="Opis stanowiska">
          <textarea className="textarea" value={form.positionDescription} onChange={(e) => setForm({ ...form, positionDescription: e.target.value })} />
        </Field>
        <Field label="Opis warunków pracy">
          <textarea className="textarea" value={form.workDescription} onChange={(e) => setForm({ ...form, workDescription: e.target.value })} />
        </Field>
      </div>
      <div className="mt-4 card">
        <div className="bold">Czynniki w szablonie</div>
        <div className="grid-2 mt-3">
          {hazards.map((hazard) => (
            <label className="check-row" key={hazard.id}>
              <input
                className="checkbox"
                checked={form.hazardIds.includes(hazard.id)}
                onChange={() => toggleHazard(hazard.id)}
                type="checkbox"
              />
              <span>
                <span className="medium">{hazard.name}</span>
                <span className="muted t-sm"> · {hazardCategoryLabels[hazard.category]}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}
