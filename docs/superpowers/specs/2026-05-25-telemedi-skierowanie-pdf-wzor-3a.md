# Telemedi - PDF skierowania wedlug wzoru zalacznika 3a
**Implementation reference · 2026-05-25**

---

## 1. Cel pliku

Ten dokument jest dodatkiem dla agenta implementujacego PDF skierowania na badania lekarskie. Glowna specyfikacja systemu odsyla tutaj, zeby uniknac blednego uproszczenia: PDF nie jest "ogolnym skierowaniem" ani zalacznikiem nr 3. Wlasciwym wzorem skierowania jest **zalacznik nr 3a** do rozporzadzenia w sprawie badan lekarskich pracownikow.

Aktualne makiety moga pokazywac uproszczony PDF. Implementacja ma isc za tym dokumentem.

---

## 2. Zrodla prawne do weryfikacji

- Dz.U. 2023 poz. 607 - tekst jednolity rozporzadzenia Ministra Zdrowia i Opieki Spolecznej z dnia 30 maja 1996 r.; kluczowe sa § 4 oraz zalacznik nr 3a: https://api.sejm.gov.pl/eli/acts/DU/2023/607/text.pdf
- Dz.U. 2026 poz. 456 - nowelizacja dotyczaca m.in. elektronicznych orzeczen lekarskich medycyny pracy: https://api.sejm.gov.pl/eli/acts/DU/2026/456/text.pdf

Przed wdrozeniem produkcyjnym trzeba ponownie sprawdzic aktualny tekst rozporzadzenia. Ten plik opisuje stan zweryfikowany na 2026-05-25.

---

## 3. Co musi zawierac skierowanie

Skierowanie powinno odwzorowac wzor z zalacznika nr 3a. Minimalny zestaw danych do wygenerowania PDF:

1. **Oznaczenie pracodawcy**
   - nazwa pracodawcy,
   - adres pracodawcy,
   - identyfikatory firmowe uzywane w systemie: NIP i REGON.

2. **Miejscowosc i data wystawienia**
   - `issuedPlace`,
   - `issuedAt`.

3. **Rodzaj badania**
   - wstepne,
   - okresowe,
   - kontrolne.

4. **Dane osoby kierowanej**
   - imie i nazwisko,
   - PESEL,
   - adres zamieszkania.

5. **Osoba bez PESEL**
   - seria dokumentu tozsamosci,
   - numer dokumentu tozsamosci,
   - nazwa dokumentu tozsamosci,
   - data urodzenia, gdy osoba jest przyjmowana do pracy.

6. **Status zatrudnienia na potrzeby skierowania**
   - osoba zatrudniona,
   - osoba podejmujaca prace.

7. **Stanowisko lub stanowiska pracy**
   - stanowisko, na ktorym osoba ma byc zatrudniona albo jest zatrudniona,
   - opcjonalnie wiecej niz jedno stanowisko, w kolejnosci odpowiadajacej potrzebom zakladu.

8. **Opis stanowiska**
   - rodzaj pracy,
   - podstawowe czynnosci,
   - sposob wykonywania pracy,
   - czas wykonywania pracy.

9. **Opis warunkow pracy i narażeń**
   - czynniki niebezpieczne, szkodliwe, uciazliwe i inne wynikajace ze sposobu wykonywania pracy,
   - nazwa kazdego czynnika,
   - wielkosc narażenia dla kazdego czynnika,
   - aktualne wyniki badan i pomiarow czynnikow szkodliwych dla zdrowia, jezeli dotycza danego stanowiska.

10. **Kategorie czynnikow w PDF**
    - I. Czynniki fizyczne,
    - II. Pyly,
    - III. Czynniki chemiczne,
    - IV. Czynniki biologiczne,
    - V. Inne czynniki, w tym niebezpieczne.

11. **Laczna liczba czynnikow**
    - suma czynnikow wpisanych w kategoriach I-V,
    - czynniki puste nie zwiekszaja licznika.

12. **Podpis pracodawcy**
    - miejsce na podpis pracodawcy,
    - w demo wystarczy placeholder.

13. **Dwa egzemplarze**
    - skierowanie jest wydawane w dwoch egzemplarzach,
    - jeden egzemplarz otrzymuje osoba kierowana na badania.

---

## 4. Mapowanie na dane systemowe

| Wzor 3a | Pole systemowe |
|---|---|
| Oznaczenie pracodawcy | `Company.name`, `Company.address`, `Company.nip`, `Company.regon` |
| Miejscowosc i data | `Referral.issuedPlace`, `Referral.issuedAt` |
| Rodzaj badania | `Referral.type` |
| Imie i nazwisko | `Referral.employeeNameSnapshot` |
| PESEL | `Referral.employeePeselSnapshot` |
| Dokument bez PESEL | `Referral.employeeIdentityDocumentSnapshot` |
| Data urodzenia bez PESEL | `Referral.employeeBirthDateSnapshot` |
| Adres zamieszkania | `Referral.employeeAddressSnapshot` |
| Zatrudniony/podejmujacy prace | `Referral.employmentContext` |
| Stanowisko/stanowiska | `Referral.positionSnapshot` |
| Rodzaj pracy/czynnosci/sposob/czas | `Referral.positionDescription` |
| Warunki pracy | `Referral.workDescription` |
| Nazwa czynnika | `ReferralHazard.factorNameSnapshot` |
| Kategoria czynnika | `ReferralHazard.category` |
| Wielkosc narażenia | `ReferralHazard.exposureValue` |
| Wyniki badan/pomiarow | `ReferralHazard.measurementResult` |
| Laczna liczba czynnikow | liczona z `ReferralHazard[]` |
| Podpis | statyczny placeholder w Phase 1 |

Snapshoty sa wymagane, bo skierowanie jest dokumentem wystawionym w konkretnym czasie. Pozniejsza zmiana danych pracownika, stanowiska lub czynnikow nie moze zmienic historycznego PDF.

---

## 5. Wymagania dla formularza

Formularz nie moze ograniczyc sie do checkboxow czynnikow. Dla kazdego czynnika wybranego do skierowania trzeba miec:

- nazwe czynnika,
- kategorie,
- wielkosc narażenia,
- pole na aktualne wyniki badan/pomiarow albo wyrazny wybor "nie dotyczy / brak pomiaru".

Pole "Opis stanowiska" powinno byc oddzielone od pola "Opis warunkow pracy". Pierwsze odpowiada na pytanie: co pracownik robi i jak dlugo. Drugie opisuje srodowisko pracy i warunki, ktore uzasadniaja wskazane czynniki.

Szablony czynnikow powinny przechowywac takze domyslne wielkosci narażenia i domyslne informacje o pomiarach, bo inaczej HR bedzie musial uzupelniac te same dane przy kazdym skierowaniu.

---

## 6. Wymagania dla PDF

- PDF renderuje kategorie w kolejnosci wzoru 3a: fizyczne, pyly, chemiczne, biologiczne, inne.
- Kategorie zawsze sa widoczne, nawet gdy sa puste.
- Pusta kategoria moze miec znak "-" albo pusta linie, ale nie moze zniknac z dokumentu.
- Kazdy wpis czynnika powinien pokazac: nazwe, wielkosc narażenia oraz wynik pomiaru, jezeli zostal podany.
- PDF nie moze wyswietlac starych lub aktualnych danych pracownika z tabeli `Employee`, jezeli skierowanie ma juz snapshot w `Referral`.
- Endpoint PDF musi byc auth-protected i tenant-scoped zgodnie z glowna specyfikacja.

---

## 7. Kryteria akceptacji dla implementacji

- Agent implementacyjny potrafi wskazac w kodzie, gdzie sa mapowane wszystkie pola z tabeli w sekcji 4.
- Wygenerowany PDF ma naglowek, rodzaj badania, dane pracodawcy, dane osoby kierowanej, stanowisko, opis stanowiska, opis warunkow pracy, piec kategorii czynnikow, licznik czynnikow i miejsce na podpis.
- Osoba bez PESEL moze przejsc przez formularz, import XLS i generowanie PDF.
- Dla bulk skierowania powstaje osobny PDF/rekord dla kazdego pracownika, ale kazdy rekord ma wlasny snapshot danych osobowych.
- Test lub fixture PDF obejmuje co najmniej: osoba z PESEL, osoba bez PESEL, puste kategorie czynnikow, czynnik z pomiarem, czynnik bez pomiaru.
