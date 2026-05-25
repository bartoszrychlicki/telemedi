"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Plus, Search, Upload } from "lucide-react";

import { apiFetch, postJson } from "@/lib/client-api";
import { maskPesel } from "@/components/telemedi/format";
import { EmptyState, ErrorState, Field, LoadingState, Modal } from "@/components/telemedi/ui";
import type { Employee } from "@/components/telemedi/types";

const emptyEmployee = {
  firstName: "",
  lastName: "",
  pesel: "",
  birthDate: "",
  identityDocumentSeries: "",
  identityDocumentNumber: "",
  identityDocumentName: "",
  identityDocumentCountry: "",
  position: "",
  address: "",
  email: "",
  phone: "",
};

type EmployeeForm = typeof emptyEmployee;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setEmployees(await apiFetch<Employee[]>("/api/employees"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return employees;
    }
    return employees.filter((employee) =>
      [
        employee.firstName,
        employee.lastName,
        employee.position,
        employee.email,
        employee.pesel ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [employees, query]);

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">Pracownicy</h1>
          <p className="page-sub">
            Kartoteka osób, dla których można wystawić skierowanie.
          </p>
        </div>
        <div className="row">
          <a className="btn btn-outline" href="/api/employees/import-template">
            <Download size={18} />
            Szablon XLS
          </a>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={18} />
            Import XLS
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
            Dodaj pracownika
          </button>
        </div>
      </div>

      <div className="card card-flush">
        <div className="card-header">
          <div className="search-wrap grow">
            <Search size={18} />
            <input
              className="input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj po nazwisku, stanowisku, emailu lub PESEL"
              value={query}
            />
          </div>
          <span className="badge badge-outline">{filtered.length} osób</span>
        </div>
        {error ? <div className="card-body"><ErrorState message={error} /></div> : null}
        {loading ? <div className="card-body"><LoadingState /></div> : null}
        {!loading && filtered.length === 0 ? (
          <EmptyState>Nie znaleziono pracowników.</EmptyState>
        ) : null}
        {!loading && filtered.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Pracownik</th>
                <th>Stanowisko</th>
                <th>PESEL</th>
                <th>Kontakt</th>
                <th>Skierowania</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="bold">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="muted t-sm">{employee.address}</div>
                  </td>
                  <td>{employee.position}</td>
                  <td className="tabular">{maskPesel(employee.pesel)}</td>
                  <td>
                    <div>{employee.email}</div>
                    <div className="muted t-sm">{employee.phone}</div>
                  </td>
                  <td>{employee._count?.referrals ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {showAdd ? (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            void load();
          }}
        />
      ) : null}
      {showImport ? (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function AddEmployeeModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EmployeeForm>(emptyEmployee);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function setField(name: keyof EmployeeForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit() {
    setPending(true);
    setError("");
    try {
      await postJson<Employee>("/api/employees", form);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title="Dodaj pracownika"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" disabled={pending} onClick={submit}>
            Zapisz
          </button>
        </>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <div className="grid-2">
        <Field label="Imię">
          <input className="input" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
        </Field>
        <Field label="Nazwisko">
          <input className="input" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
        </Field>
        <Field label="PESEL">
          <input className="input" value={form.pesel} onChange={(e) => setField("pesel", e.target.value)} />
        </Field>
        <Field label="Stanowisko">
          <input className="input" value={form.position} onChange={(e) => setField("position", e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
        </Field>
        <Field label="Telefon">
          <input className="input" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Adres zamieszkania">
          <input className="input" value={form.address} onChange={(e) => setField("address", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function ImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    imported: Employee[];
    errors: { row: number; message: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!file) {
      setError("Wybierz plik XLSX.");
      return;
    }
    setPending(true);
    setError("");
    const body = new FormData();
    body.set("file", file);

    try {
      const response = await fetch("/api/employees/import", {
        method: "POST",
        body,
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "Import nie powiódł się.");
      }
      setResult(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title="Import pracowników z XLS"
      onClose={onClose}
      footer={
        result ? (
          <button className="btn btn-primary" onClick={onImported}>Zamknij i odśwież</button>
        ) : (
          <>
            <button className="btn btn-outline" onClick={onClose}>Anuluj</button>
            <button className="btn btn-primary" disabled={pending} onClick={submit}>
              Importuj
            </button>
          </>
        )
      }
    >
      <div className="banner banner-info">
        <FileSpreadsheet size={20} />
        <div>
          Pobierz szablon XLS, uzupełnij dane i wgraj plik. Import pomija błędne
          wiersze i pokaże ich listę.
        </div>
      </div>
      <input
        className="input mt-4"
        type="file"
        accept=".xlsx"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {result ? (
        <div className="mt-4 col">
          <div className="badge status-scheduled">
            Zaimportowano: {result.imported.length}
          </div>
          {result.errors.length ? (
            <div className="card">
              <div className="bold">Wiersze do poprawy</div>
              <ul className="mt-2 list-disc pl-5">
                {result.errors.map((item) => (
                  <li key={`${item.row}-${item.message}`}>
                    Wiersz {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
