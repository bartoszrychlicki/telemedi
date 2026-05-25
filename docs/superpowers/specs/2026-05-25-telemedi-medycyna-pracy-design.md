# Telemedi — System zarządzania zleceniami medycyny pracy
**Design spec · 2026-05-25**

---

## 0. Status dokumentu

To jest specyfikacja projektowa przed implementacją. Aktualne artefakty `.superpowers/brainstorm/...` są makietami koncepcyjnymi i mogą zawierać starsze etykiety lub uproszczenia. Dla agenta implementującego źródłem prawdy jest ten dokument oraz dodatek: [`2026-05-25-telemedi-skierowanie-pdf-wzor-3a.md`](./2026-05-25-telemedi-skierowanie-pdf-wzor-3a.md).

---

## 1. Kontekst i cel

Telemedi (Telmedicin sp. z o.o.) to polska platforma telemedyczna B2B/B2B2C (~55M PLN przychodu 2024, przejęta przez Mavie Next/UNIQA), oferująca m.in. medycynę pracy dla klientów korporacyjnych z siecią 2300+ klinik.

**Problem:** Proces zlecania badań medycyny pracy odbywa się poza systemem — przez maile, telefony i ręczne dokumenty. Brak śledzenia statusów, terminów i historii skierowań.

**Cel:** Wewnętrzny portal webowy umożliwiający firmom-klientom Telemedi samodzielne wystawianie skierowań na badania medycyny pracy dla swoich pracowników, z pełnym śledzeniem statusu procesu.

**Użytkownicy docelowi:** Pracownicy działów HR/kadr firm-klientów. Persona: panie 50+, nietech­niczne, desktop, przeglądarka. Zasada UX: im prościej, tym lepiej. Duże elementy, wysokie kontrasty, zero domyślania się.

---

## 2. Zakres (Phase 1)

### W zakresie
- Portal HR firm-klientów (wystawianie skierowań, zarządzanie pracownikami)
- Panel Telemedi Admin — minimalistyczny (zarządzanie firmami + invite)
- Mock integracji z systemem ticketowym (dev-only panel)
- Generowanie PDF skierowania według wzoru z załącznika nr 3a do rozporządzenia MZ
- Stub e-orzeczenia medycyny pracy (widoczny w UI, bez integracji w Phase 1)

### Poza zakresem (v2)
- Faktyczna integracja webhook z systemem ticketowym call center
- Wysyłka maili z systemu (SMTP / Resend)
- E-orzeczenia medycyny pracy / integracja z obiegiem SIM/IKP lub sposobem przekazania orzeczenia przez jednostkę medycyny pracy
- Aplikacja mobilna
- Integracja z NFZ/POZ

---

## 3. Stack technologiczny

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Framework | Next.js 15 App Router | SSR, API Routes, middleware RBAC |
| UI | shadcn/ui + Tailwind | Gotowe komponenty, spójny design system |
| Auth | **Better Auth** (organizations plugin) | Nowoczesny, natywny dla App Router, wbudowane organizacje/multi-tenancy, invite flow bez SMTP |
| ORM | Prisma | Type-safe queries, migracje |
| Baza danych | PostgreSQL | (Supabase lub Neon dla Vercel deploy) |
| PDF | `@react-pdf/renderer` | Server-side, Next.js API Route |
| XLS import | SheetJS (`xlsx`) | Parsowanie pliku po stronie serwera |
| Deploy | Vercel | Zero-config dla Next.js |

---

## 4. Architektura aplikacji

```
/app
  /(auth)
    /login
    /accept-invite            ← Better Auth invite token handler
  /admin                      ← Telemedi Super Admin (rola SUPER_ADMIN)
    /companies                ← lista firm + tworzenie workspace + invite
  /portal                     ← HR portal firm-klientów
    /dashboard                ← Przegląd / statystyki
    /employees                ← Lista pracowników firmy
    /referrals
      /page                   ← Lista skierowań z filtrami
      /new                    ← Wizard wystawienia (2 kroki)
      /[id]                   ← Szczegóły skierowania + timeline statusu
    /hazards                  ← Czynniki narażeń (systemowe + firmowe)
    /templates                ← Szablony czynników narażeń
    /settings                 ← Zarządzanie kontami (tylko Koordynator)
/api
  /referrals/[id]/pdf         ← Generowanie PDF (GET, auth-protected)
  /employees/import           ← Import XLS (POST, multipart)
  /referrals/[id]/status      ← Zmiana statusu (POST, dev-mock + produkcja)
```

**Middleware** na `/admin/*` i `/portal/*` sprawdza sesję Better Auth przy każdym request.

---

## 5. Multi-tenancy i izolacja danych

- Każda firma-klient = **Better Auth Organization** (1:1 z modelem `Company`)
- Każde query filtruje po `companyId` pobranym **wyłącznie z sesji** — nigdy z URL/query params
- `SUPER_ADMIN` ma dostęp cross-tenant przez osobne sprawdzenie `user.role` poza org

---

## 6. Model danych

```prisma
model Company {
  id          String   @id @default(cuid())
  name        String
  nip         String
  regon       String
  address     String
  contactPhone String?
  orgId       String   @unique  // Better Auth Organization ID
  createdAt   DateTime @default(now())

  users       User[]
  employees   Employee[]
  hazards     HazardFactor[]
  templates   Template[]
  referrals   Referral[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      UserRole // SUPER_ADMIN | COORDINATOR | HR_STAFF
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id])
  // Better Auth handles password hash, sessions, invite tokens
}

enum UserRole {
  SUPER_ADMIN
  COORDINATOR
  HR_STAFF
}

model Employee {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])

  firstName  String
  lastName   String
  pesel      String?   // jeśli brak PESEL, wymagane pola dokumentu poniżej
  birthDate  DateTime? // wymagane przy osobie bez PESEL przyjmowanej do pracy
  identityDocumentSeries String?
  identityDocumentNumber String?
  identityDocumentName   String?
  identityDocumentCountry String?
  position   String
  address    String
  email      String
  phone      String
  archivedAt DateTime? // soft delete / dezaktywacja zamiast kasowania historii

  referrals  Referral[]
}

model HazardFactor {
  id        String          @id @default(cuid())
  category  HazardCategory  // PHYSICAL | CHEMICAL | BIOLOGICAL | DUST | OTHER
  name      String
  isSystem  Boolean         @default(false)  // true = Telemedi (readonly dla firm)
  companyId String?         // null dla systemowych
  company   Company?        @relation(fields: [companyId], references: [id])
}

enum HazardCategory {
  PHYSICAL
  CHEMICAL
  BIOLOGICAL
  DUST
  OTHER
}

model Template {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  name            String
  positionDescription String? // opcjonalne — auto-wypełnia opis stanowiska
  workDescription String?     // opcjonalne — auto-wypełnia opis warunków pracy
  createdAt       DateTime @default(now())

  hazardFactors   TemplateHazard[]
}

model TemplateHazard {
  templateId     String
  hazardFactorId String
  template       Template     @relation(fields: [templateId], references: [id])
  hazardFactor   HazardFactor @relation(fields: [hazardFactorId], references: [id])
  defaultExposureValue String?      // domyślna wielkość narażenia do PDF 3a
  defaultMeasurementResult String?  // domyślne wyniki badań/pomiarów, jeśli dotyczy

  @@id([templateId, hazardFactorId])
}

model Referral {
  id               String         @id @default(cuid())
  companyId        String
  company          Company        @relation(fields: [companyId], references: [id])
  employeeId       String
  employee         Employee       @relation(fields: [employeeId], references: [id])

  type             ReferralType   // INITIAL | PERIODIC | CONTROL
  status           ReferralStatus @default(DRAFT)
  attentionReason  ReferralAttentionReason @default(NONE)

  // Snapshot dokumentu - późniejsza zmiana Employee nie zmienia historycznego PDF
  employeeNameSnapshot String
  employeePeselSnapshot String?
  employeeBirthDateSnapshot DateTime?
  employeeIdentityDocumentSnapshot String?
  employeeAddressSnapshot String
  employmentContext EmploymentContext // EMPLOYED | STARTING_WORK
  positionSnapshot String         // stanowisko/stanowiska w chwili wystawienia
  positionDescription String      // rodzaj pracy, czynności, sposób i czas wykonywania
  workDescription  String         // opis warunków pracy i środowiska pracy
  issuedPlace      String
  deadlineDate     DateTime
  issuedAt         DateTime       @default(now())

  // Wypełniane przez panel testowy / przyszłą integrację ticketową
  facilityName     String?
  appointmentDate  DateTime?

  // Stub e-orzeczenia medycyny pracy
  occupationalMedicineCertificateRef String? // placeholder dla przyszłej integracji SIM/IKP/obiegu orzeczeń

  createdById      String
  createdBy        User           @relation(fields: [createdById], references: [id])
  hazardFactors    ReferralHazard[]
}

enum ReferralType {
  INITIAL    // Wstępne
  PERIODIC   // Okresowe
  CONTROL    // Kontrolne
}

enum ReferralStatus {
  DRAFT        // Szkic
  SUBMITTED    // Zlecone (łączy "Wysłane" + "W trakcie umawiania")
  SCHEDULED    // Umówione (facilityName + appointmentDate wypełnione)
  COMPLETED    // Zrealizowane (badanie odbyło się)
  CLOSED       // Orzeczenie gotowe ✓
  CANCELLED    // Anulowane
}

enum ReferralAttentionReason {
  NONE
  NEEDS_CORRECTION        // HR musi poprawić dane/skierowanie
  EMPLOYEE_UNREACHABLE    // Telemedi nie może skontaktować się z pracownikiem
  RESCHEDULE_REQUIRED     // termin wymaga przełożenia
  NO_SHOW                 // pracownik nie stawił się na badaniu
  NEGATIVE_DECISION       // orzeczenie negatywne / przeciwwskazania
}

enum EmploymentContext {
  EMPLOYED       // zatrudniony/zatrudniona
  STARTING_WORK  // podejmujący/podejmująca pracę
}

model ReferralHazard {
  id             String @id @default(cuid())
  referralId     String
  hazardFactorId String?
  referral       Referral      @relation(fields: [referralId], references: [id])
  hazardFactor   HazardFactor? @relation(fields: [hazardFactorId], references: [id])

  category       HazardCategory
  factorNameSnapshot String
  exposureValue  String      // wielkość narażenia wymagana do PDF 3a
  measurementResult String?  // aktualne wyniki badań/pomiarów, jeśli dotyczy
  notes          String?

  @@index([referralId])
}
```

---

## 7. Role i uprawnienia (RBAC)

| Akcja | SUPER_ADMIN | COORDINATOR | HR_STAFF |
|---|---|---|---|
| Tworzy firmy (workspace) | ✅ | ✗ | ✗ |
| Generuje invite link dla Koordynatora | ✅ | ✗ | ✗ |
| Zakłada konta HR_STAFF | ✅ | ✅ | ✗ |
| Zarządza listą pracowników | ✅ | ✅ | ✅ |
| Wystawia skierowania | ✅ | ✅ | ✅ |
| Zarządza czynnikami i szablonami | ✅ | ✅ | ✅ |
| Pobiera PDF skierowania | ✅ | ✅ | ✅ |
| Widzi panel testowy statusów | tylko środowisko developerskie — wszyscy |

### Invite flow (bez SMTP)
1. SUPER_ADMIN tworzy firmę → Better Auth tworzy Organization
2. System generuje invite URL z tokenem → modal pokazuje link z przyciskiem "Kopiuj"
3. Admin wysyła link ręcznie (email firmowy, Slack, itp.)
4. Nowy user klika link → rejestruje się → automatycznie trafia do org z rolą `coordinator`
5. Koordynator zaprasza HR_STAFF tym samym mechanizmem

**Demo seed:** pre-seedowane konta `admin@telemedi.pl` / `koordynator@demo.pl` / `hr@demo.pl` z hasłami — omijają invite flow.

---

## 8. Nawigacja — Portal HR

**Layout:** Left sidebar (ciemnoniebieskie tło) + main content area.

**Sidebar:**
```
[Logo Telemedi]
[Nazwa firmy — workspace]
─────────────────
📊 Przegląd
👥 Pracownicy
📋 Skierowania
⚠️  Czynniki narażeń
📁 Szablony
─────────────────
⚙️  Ustawienia        (tylko Koordynator)
─────────────────
[Avatar] Imię Nazwisko
         Rola · Firma
```

---

## 9. Moduły — szczegóły

### 9.1 Pracownicy

- **Tabela:** Imię i nazwisko / Stanowisko / Email / Telefon / Liczba skierowań
- **Wyszukiwarka:** po nazwisku, imieniu, stanowisku, PESEL (min. 4 znaki). W wynikach PESEL zawsze maskowany.
- **Dodawanie ręczne:** modal z formularzem
- **Import XLS:**
  - Przycisk "Pobierz szablon" → plik `szablon_pracownicy.xlsx` z przykładowymi danymi w wierszu 1
  - Kolumny: `imie | nazwisko | pesel | data_urodzenia | dokument_seria | dokument_numer | dokument_nazwa | dokument_kraj | stanowisko | adres | email | telefon`
  - Upload → walidacja server-side (SheetJS): brakujące kolumny, błędny PESEL, brak PESEL i brak danych dokumentu, zduplikowany email
  - Raport po imporcie: wiersze OK zaimportowane, wiersze z błędami — tabela z numerem wiersza i opisem błędu
- **Archiwizacja pracownika:** soft delete (`archivedAt`), bez kasowania historii skierowań. Archiwizowany pracownik znika z domyślnej listy wyboru, ale pozostaje w historii i PDF-ach.

### 9.2 Czynniki narażeń

Widok z 5 zakładkami: Fizyczne / Chemiczne / Biologiczne / Pyły / Inne. PDF renderuje te same dane w kolejności wzoru 3a: Fizyczne / Pyły / Chemiczne / Biologiczne / Inne.

Każda zakładka:
- **Sekcja systemowa** (szary background, ikona 🔒) — lista Telemedi, readonly dla firm
- **Sekcja firmowa** — czynniki dodane przez tę firmę, każdy edytowalny i usuwalny
- **Input bulk:** pole z placeholderem *"Dodaj własne czynniki, oddzielając przecinkami..."* → po zapisie split + trim → osobne rekordy `HazardFactor`

### 9.3 Szablony

Lista kart: Nazwa / Liczba czynników / Skrót opisu stanowiska i warunków pracy / Data utworzenia.
Akcje per karta: Użyj (otwiera formularz skierowania z pre-wypełnieniem) / Edytuj / Usuń.

**Tworzenie/edycja:** ten sam układ 5 kategorii co formularz skierowania + domyślna wielkość narażenia i wynik pomiaru per czynnik + pola `positionDescription` i `workDescription` (textarea, opcjonalne).

### 9.4 Wizard skierowania — 2 kroki

#### Krok 1: Pracownicy + rodzaj + szablon

- **Multi-select pracowników:** pole wyszukiwarki (po nazwisku / imieniu / stanowisku / PESEL) → dropdown wyników z przyciskiem "+ Dodaj" per wynik → lista wybranych jako karty z "×"
- **Baner ostrzegawczy** (żółty): pojawia się tylko gdy `selectedEmployees.length > 1` — *"Skierowanie zbiorcze: wszyscy N pracownicy otrzymają identyczne skierowania. Upewnij się, że warunki pracy są dla nich jednakowe."*
- **Rodzaj badania:** duże radio buttons z opisem — Wstępne / Okresowe / Kontrolne
- **Szablon** (opcjonalny dropdown): jeśli wybrany → auto-wypełnia czynniki, wielkości narażenia, wyniki pomiarów, `positionDescription` i `workDescription` w kroku 2

#### Krok 2: Czynniki + opis + termin

- Breadcrumb kontekstu:
  - dla jednej osoby: *"Pracownik: Anna Kowalska · Badanie: Wstępne"*
  - dla wielu osób: *"3 pracowników · Badanie: Wstępne · identyczne warunki pracy"*
- **5 akordeonów** (Fizyczne / Chemiczne / Biologiczne / Pyły / Inne):
  - Każdy pokazuje liczbę zaznaczonych czynników w badge
  - Czynniki systemowe (checkbox) + czynniki firmowe (checkbox, fioletowy kolor)
  - Inline input "Dodaj własne (po przecinku)..." na dole każdej kategorii
- **Dane narażenia per czynnik:** po zaznaczeniu czynnika UI pokazuje krótkie pola:
  - `wielkość narażenia` (wymagane),
  - `wyniki badań/pomiarów` albo wybór "nie dotyczy / brak pomiaru".
- **Opis stanowiska** (textarea, wymagany) — rodzaj pracy, podstawowe czynności, sposób i czas ich wykonywania
- **Opis warunków pracy** (textarea, wymagany) — środowisko pracy i warunki uzasadniające wybrane czynniki
- **Termin dostarczenia orzeczenia** (datepicker, wymagany)
- **Bulk confirmation:** jeśli wybrano więcej niż jednego pracownika, przed generowaniem wymagany checkbox *"Potwierdzam, że wszyscy wybrani pracownicy mają identyczne stanowisko/warunki pracy dla tego skierowania."*
- **Inteligentny zapis szablonu:**
  - Brak szablonu w kroku 1 → checkbox "Zapisz jako szablon" + pole nazwy
  - Szablon wybrany, nic nie zmieniono → brak prompta
  - Szablon wybrany, coś zmieniono → po "Generuj" modal: *"Wykryto zmiany w szablonie '[nazwa]'"* → opcje: *Zaktualizuj szablon* / *Zapisz jako nowy* (+ pole nazwy) / *Nie zapisuj*
- **"Generuj skierowanie" / "Wygeneruj N skierowań"** → tworzy N rekordów `Referral` (jeden per pracownik), status = `SUBMITTED`, każdy z własnym snapshotem danych pracownika

### 9.5 Lista skierowań

- Tabela: Pracownik / Rodzaj / Termin / Status / Akcje
- Filtry: po statusie, rodzaju badania, wyszukiwarka po nazwisku
- Termin w tabeli: pełna data + badge `PILNE · X dni` gdy deadline ≤ 7 dni (overlay, nie status)
- Jeśli `attentionReason != NONE`, przy statusie widoczny badge "Wymaga uwagi" z krótkim powodem
- Przycisk "Szczegóły" → widok szczegółów
- Przycisk "+ Nowe skierowanie" → wizard

### 9.6 Szczegóły skierowania

- Header: imię/nazwisko, stanowisko, rodzaj badania, data wystawienia, przycisk "↓ PDF"
- **Timeline pionowy** z timestampami dla każdego ukończonego statusu
- Gdy status = `SCHEDULED`: pod krokiem "Umówione" widoczne `facilityName` + `appointmentDate`
- Przy ostatnim kroku: sekcja **e-orzeczenie medycyny pracy** z ikoną 🔒 i labelką *"Integracja z elektronicznym orzeczeniem medycyny pracy — wkrótce"* (stub, disabled). Nie używać nazwy e-ZLA.
- **Termin** na dole: `⏰ Termin orzeczenia: DD.MM.YYYY (za X dni)` — pomarańczowy

### 9.7 Panel testowy statusów (dev-only)

- Floating button `● panel testowy` w prawym dolnym rogu widoku szczegółów
- Renderowany wyłącznie w środowisku developerskim; produkcyjny build nie może zawierać tego UI
- Po kliknięciu: ciemny panel z akcjami:
  - `→ Zlecone` (jeśli status = DRAFT)
  - `→ Umówione` (wymaga wpisania placówki + daty/godziny)
  - `→ Zrealizowane`
  - `→ Orzeczenie gotowe`
- Wywołuje `POST /api/referrals/[id]/status` — ten sam endpoint co produkcja

---

## 10. Statusy skierowania

| Status | Label w UI | Kolor | Co oznacza dla HR |
|---|---|---|---|
| `DRAFT` | Szkic | Szary (dashed border) | HR: dokończ i wyślij |
| `SUBMITTED` | Zlecone | Pomarańczowy | Telemedi kontaktuje się z pracownikiem |
| `SCHEDULED` | Umówione 📅 | Zielony (wyróżniony) | Badanie zaplanowane — widać placówkę i termin |
| `COMPLETED` | Zrealizowane | Niebieski | Pracownik był na badaniu, czekamy na orzeczenie |
| `CLOSED` | Orzeczenie gotowe ✓ | Fioletowy | Sprawa zamknięta |
| `CANCELLED` | Anulowane | Szary | Proces przerwany, nie liczy się jako aktywny |

**Termin jako osobny wskaźnik** (nie status): badge `PILNE · X dni` pojawia się na liście i szczegółach gdy `deadlineDate - now() ≤ 7 dni` i status ≠ `CLOSED`.

**Powody wymagające uwagi** (badge obok statusu, nie zastępuje głównego statusu):

| `attentionReason` | Label w UI | Co ma zrobić HR |
|---|---|---|
| `NEEDS_CORRECTION` | Do poprawy | poprawić dane pracownika/skierowania |
| `EMPLOYEE_UNREACHABLE` | Brak kontaktu | pomóc Telemedi skontaktować się z pracownikiem |
| `RESCHEDULE_REQUIRED` | Zmiana terminu | potwierdzić nowy termin lub dostępność |
| `NO_SHOW` | Nie stawił się | zdecydować o ponownym umówieniu |
| `NEGATIVE_DECISION` | Przeciwwskazania | odebrać informację o negatywnym orzeczeniu i zamknąć sprawę zgodnie z procedurą |

---

## 11. PDF skierowania

Generowany server-side przez `@react-pdf/renderer` na endpoint `GET /api/referrals/[id]/pdf`.

**Źródło wzoru:** załącznik nr 3a, nie załącznik nr 3. Szczegółowy opis pól i mapowania znajduje się w [`2026-05-25-telemedi-skierowanie-pdf-wzor-3a.md`](./2026-05-25-telemedi-skierowanie-pdf-wzor-3a.md).

**Zawartość Phase 1:**
1. Oznaczenie pracodawcy: nazwa, adres, NIP, REGON.
2. Miejscowość i data wystawienia (`issuedPlace`, `issuedAt`).
3. Nagłówek skierowania i rodzaj badania: Wstępne / Okresowe / Kontrolne.
4. Dane osoby kierowanej: imię i nazwisko, PESEL albo dane dokumentu tożsamości, data urodzenia gdy wymagana, adres zamieszkania.
5. Kontekst: zatrudniony/zatrudniona albo podejmujący/podejmująca pracę.
6. Stanowisko/stanowiska (`positionSnapshot`).
7. Opis stanowiska (`positionDescription`): rodzaj pracy, podstawowe czynności, sposób i czas wykonywania.
8. Opis warunków pracy (`workDescription`).
9. Czynniki narażeń w kolejności wzoru 3a: Fizyczne / Pyły / Chemiczne / Biologiczne / Inne. Kategorie zawsze widoczne, puste = "—".
10. Dla każdego czynnika: nazwa, wielkość narażenia, aktualne wyniki badań/pomiarów albo oznaczenie "nie dotyczy / brak pomiaru".
11. Łączna liczba czynników wskazanych w skierowaniu.
12. Placeholder: [podpis pracodawcy].
13. Informacja wewnętrzna dla implementacji: skierowanie jest wydawane w dwóch egzemplarzach, z których jeden otrzymuje osoba kierowana na badania.

Dostępny dla: `HR_STAFF`, `COORDINATOR`, `SUPER_ADMIN` (przy wejściu w workspace firmy).

---

## 12. Panel Telemedi Admin (/admin)

Minimalistyczny. Dostępny tylko dla `SUPER_ADMIN`.

**Nawigacja:** Firmy / Statystyki / Czynniki systemowe

**Lista firm:**

| Kolumna | Opis |
|---|---|
| Firma | Nazwa + liczba pracowników |
| NIP | Identyfikator |
| Koordynator | ● aktywny / ⏳ invite wysłany |
| Skierowania | X otwartych / Y zamkniętych |
| Akcje | Wejdź jako firma (impersonacja workspace) / ⟳ wyślij link (regeneruj invite) |

Otwarte = `DRAFT + SUBMITTED + SCHEDULED + COMPLETED`. Zamknięte = `CLOSED`.

**Modal "Dodaj firmę":** Nazwa · NIP · REGON · Adres · Telefon → generuje invite URL → przycisk "Kopiuj link".

**Czynniki systemowe:** CRUD na `HazardFactor` gdzie `isSystem = true`. Lista readonly dla firm-klientów.

---

## 13. Ograniczenia i decyzje techniczne

- **Brak SMTP w Phase 1** — cały kontakt z pracownikiem po stronie call center Telemedi. System nie wysyła żadnych maili.
- **Brak UI wysyłki maila do pracownika w Phase 1** — jeśli starsze makiety pokazują "Wyślij email", agent implementujący ma to pominąć albo ukryć jako dev-only stub, nie jako funkcję HR.
- **Invite bez maila** — Better Auth generuje token, admin kopiuje link i wysyła ręcznie.
- **Mock integracja** — zmiana statusu przez panel testowy lub przyszłe webhook'i używa tego samego API endpointu. Swap na realną integrację = podmiana logiki jednej funkcji.
- **Izolacja tenantów** — `companyId` z sesji, nigdy z inputu użytkownika.
- **e-orzeczenia medycyny pracy** — pole `occupationalMedicineCertificateRef` w DB gotowe, UI pokazuje stub z 🔒. Nie używać nazwy e-ZLA.
- **Zmiany prawne 2026** — elektroniczne orzeczenia medycyny pracy od 17.04.2026 są w Phase 1 tylko stubem UI; pełny obieg zależy od ustaleń z jednostką medycyny pracy i systemem/umową przekazania orzeczenia pracodawcy.

---

## 14. UX baseline dla implementacji

- Persona 50+, nietechniczna: domyślny font w aplikacji 14-16px, kontrolki min. 44px wysokości, wyraźne kontrasty.
- Nie używać samotnych ikon jako głównych akcji w portalu HR. Zamiast `→` używać etykiet: "Szczegóły", "Pobierz PDF", "Nowe skierowanie".
- Mikrocopy po polsku: "Szkic", "Czynniki systemowe", "Panel testowy", "Orzeczenie gotowe". Unikać w HR UI tekstów technicznych typu `Draft`, `NODE_ENV`, `webhook`.
- Dane demo muszą być fikcyjne i maskowane tam, gdzie nie są potrzebne: PESEL jako `85****4521`, email częściowo maskowany w listach, pełne dane tylko w PDF/podglądzie dokumentu.
- Dashboard ma pokazywać akcje, nie tylko liczby: "Skierowania w toku", "Umówione wizyty", "Pilne terminy ≤ 7 dni" oraz listę "Wymaga uwagi" z bezpośrednim przejściem do sprawy.
- Daty względne liczone dynamicznie względem daty systemowej albo jawnie zamrożonej daty demo. Jeśli termin 30.05.2026 jest pokazywany przy dacie demo 25.05.2026, badge to `PILNE · 5 dni`.

---

## 15. Otwarte pytania (do v2)

- Jaki system ticketowy używa Telemedi call center? (Freshdesk / własny?) → definiuje format webhooka
- Czy potrzebny jest widok historii skierowań per pracownik (zakładka w profilu pracownika)?
- Czy admin Telemedi potrzebuje raportów zbiorczych (eksport XLS wszystkich skierowań)?
- Czy w v2 jakikolwiek kanał mailowy ma być częścią systemu, czy kontakt z pracownikiem pozostaje w całości po stronie call center?
