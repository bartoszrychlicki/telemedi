"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { apiFetch, postJson } from "@/lib/client-api";
import { validateRequired } from "@/lib/form-validation";
import {
  hazardCategoryLabels,
  hazardCategoryOrder,
  referralTypeLabels,
} from "@/components/telemedi/format";
import { ErrorState, Field, LoadingState } from "@/components/telemedi/ui";
import type {
  CompanySettings,
  Employee,
  Hazard,
  ReferralDetail,
  ReferralType,
  Template,
} from "@/components/telemedi/types";

type SelectedHazard = {
  hazardFactorId: string;
  category: string;
  factorName: string;
  exposureValue: string;
  measurementResult: string;
};

export default function NewReferralPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [type, setType] = useState<ReferralType>("PERIODIC");
  const [employmentContext, setEmploymentContext] = useState<"EMPLOYED" | "STARTING_WORK">("EMPLOYED");
  const [deadlineDate, setDeadlineDate] = useState("2026-06-30");
  const [positionDescription, setPositionDescription] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [selectedHazards, setSelectedHazards] = useState<SelectedHazard[]>([]);
  const [saveAsTemplateName, setSaveAsTemplateName] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [employeeData, hazardData, templateData, settingsData] = await Promise.all([
          apiFetch<Employee[]>("/api/employees"),
          apiFetch<Hazard[]>("/api/hazards"),
          apiFetch<Template[]>("/api/templates"),
          apiFetch<CompanySettings>("/api/company/settings"),
        ]);
        setEmployees(employeeData);
        setHazards(hazardData);
        setTemplates(templateData);
        setSettings(settingsData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => employeeIds.includes(employee.id)),
    [employees, employeeIds],
  );

  function toggleEmployee(id: string) {
    setEmployeeIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }
    setPositionDescription(template.positionDescription ?? "");
    setWorkDescription(template.workDescription ?? "");
    setSelectedHazards(
      template.hazardFactors.map((item) => ({
        hazardFactorId: item.hazardFactorId,
        category: item.hazardFactor.category,
        factorName: item.hazardFactor.name,
        exposureValue:
          item.defaultExposureValue ?? "zgodnie z oceną ryzyka zawodowego",
        measurementResult:
          item.defaultMeasurementResult ?? "brak aktualnego pomiaru / nie dotyczy",
      })),
    );
  }

  function toggleHazard(hazard: Hazard) {
    setSelectedHazards((current) => {
      if (current.some((item) => item.hazardFactorId === hazard.id)) {
        return current.filter((item) => item.hazardFactorId !== hazard.id);
      }
      return [
        ...current,
        {
          hazardFactorId: hazard.id,
          category: hazard.category,
          factorName: hazard.name,
          exposureValue: "zgodnie z oceną ryzyka zawodowego",
          measurementResult: "brak aktualnego pomiaru / nie dotyczy",
        },
      ];
    });
  }

  function updateHazard(id: string, key: "exposureValue" | "measurementResult", value: string) {
    setSelectedHazards((current) =>
      current.map((item) => (item.hazardFactorId === id ? { ...item, [key]: value } : item)),
    );
  }

  function goToStep2() {
    const validationError = validateRequired([
      { label: "Pracownicy", value: employeeIds.length ? "selected" : "" },
      { label: "Termin wykonania badań", value: deadlineDate },
    ]);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStep(2);
  }

  async function submit() {
    if (pending) return;
    setError("");

    const validationError =
      validateRequired([
        { label: "Opis stanowiska", value: positionDescription },
        { label: "Opis warunków pracy", value: workDescription },
        { label: "Czynniki", value: selectedHazards.length ? "selected" : "" },
      ]) ??
      validateRequired(
        selectedHazards.map((hazard) => ({
          label: `Wielkość narażenia: ${hazard.factorName}`,
          value: hazard.exposureValue,
        })),
      );

    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      const result = await postJson<ReferralDetail[]>("/api/referrals", {
        employeeIds,
        type,
        employmentContext,
        issuedPlace: settings?.pdfIssuedPlace ?? "Warszawa",
        deadlineDate,
        positionDescription,
        workDescription,
        hazards: selectedHazards,
        bulkConfirmation: employeeIds.length <= 1 ? undefined : true,
        saveAsTemplateName: saveAsTemplateName || null,
      });
      router.push(`/portal/referrals/${result[0].id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <div className="page"><LoadingState /></div>;
  }

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">Nowe skierowanie</h1>
          <p className="page-sub">
            Dwa kroki: wybór pracowników i rodzaju badania, potem opis pracy oraz czynniki.
          </p>
        </div>
        <div className="steps row">
          <span className={`badge ${step === 1 ? "status-scheduled" : "badge-outline"}`}>1. Dane</span>
          <span className={`badge ${step === 2 ? "status-scheduled" : "badge-outline"}`}>2. Czynniki</span>
        </div>
      </div>

      {error ? <div className="mb-4"><ErrorState message={error} /></div> : null}

      {step === 1 ? (
        <section className="grid-2">
          <div className="card col">
            <h2 className="t-lg bold">Pracownicy</h2>
            <div className="col">
              {employees.map((employee) => (
                <label className="check-row" key={employee.id}>
                  <input
                    className="checkbox"
                    checked={employeeIds.includes(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                    type="checkbox"
                  />
                  <span>
                    <span className="medium">
                      {employee.firstName} {employee.lastName}
                    </span>
                    <span className="muted t-sm"> · {employee.position}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="card col">
            <h2 className="t-lg bold">Badanie i termin</h2>
            <Field label="Rodzaj badania" required>
              <select className="select" required value={type} onChange={(e) => setType(e.target.value as ReferralType)}>
                {Object.entries(referralTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Kontekst zatrudnienia" required>
              <select className="select" required value={employmentContext} onChange={(e) => setEmploymentContext(e.target.value as "EMPLOYED" | "STARTING_WORK")}>
                <option value="EMPLOYED">Osoba zatrudniona</option>
                <option value="STARTING_WORK">Osoba podejmująca pracę</option>
              </select>
            </Field>
            <Field label="Termin wykonania badań" required>
              <input className="input" required type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
            </Field>
            <Field label="Szablon stanowiska">
              <select className="select" onChange={(e) => applyTemplate(e.target.value)} defaultValue="">
                <option value="" disabled>Wybierz szablon</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </Field>
            <button
              className="btn btn-primary"
              disabled={employeeIds.length === 0}
              onClick={goToStep2}
            >
              Dalej
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      ) : (
        <section className="col gap-lg">
          <div className="card">
            <div className="row between">
              <div>
                <h2 className="t-lg bold">Opis skierowania</h2>
                <p className="muted t-sm">
                  Wybrano {selectedEmployees.length} pracowników i {selectedHazards.length} czynników.
                </p>
              </div>
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                <ArrowLeft size={18} />
                Wróć
              </button>
            </div>
            <div className="grid-2 mt-4">
              <Field label="Opis stanowiska" required>
                <textarea className="textarea" required value={positionDescription} onChange={(e) => setPositionDescription(e.target.value)} />
              </Field>
              <Field label="Opis warunków pracy" required>
                <textarea className="textarea" required value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h2 className="t-lg bold">Dostępne czynniki</h2>
              <div className="col mt-4">
                {hazardCategoryOrder.map((category) => (
                  <div key={category}>
                    <div className="label">{hazardCategoryLabels[category]}</div>
                    <div className="col gap-sm">
                      {hazards.filter((hazard) => hazard.category === category).map((hazard) => (
                        <label className="check-row" key={hazard.id}>
                          <input
                            className="checkbox"
                            checked={selectedHazards.some((item) => item.hazardFactorId === hazard.id)}
                            onChange={() => toggleHazard(hazard)}
                            type="checkbox"
                          />
                          <span>{hazard.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h2 className="t-lg bold">Wartości narażenia do PDF</h2>
              <div className="col mt-4">
                {selectedHazards.map((hazard) => (
                    <div className="card" key={hazard.hazardFactorId}>
                      <div className="bold">{hazard.factorName}</div>
                    <Field label="Wielkość narażenia" required>
                      <input className="input" required value={hazard.exposureValue} onChange={(e) => updateHazard(hazard.hazardFactorId, "exposureValue", e.target.value)} />
                    </Field>
                    <Field label="Wyniki pomiarów">
                      <input className="input" value={hazard.measurementResult} onChange={(e) => updateHazard(hazard.hazardFactorId, "measurementResult", e.target.value)} />
                    </Field>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Field label="Zapisz też jako nowy szablon">
                  <input className="input" value={saveAsTemplateName} onChange={(e) => setSaveAsTemplateName(e.target.value)} placeholder="Opcjonalnie" />
                </Field>
              </div>
              <button
                className="btn btn-primary mt-4"
                disabled={pending || selectedHazards.length === 0 || !positionDescription || !workDescription}
                onClick={submit}
              >
                <CheckCircle2 size={18} />
                Wystaw skierowanie
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
