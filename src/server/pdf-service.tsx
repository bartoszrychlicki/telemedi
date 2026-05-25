import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { hazardCategoryLabels, hazardCategoryPdfOrder, referralTypeLabels } from "@/lib/constants";
import { getReferral } from "@/server/referral-service";
import type { HazardCategory } from "@/generated/prisma/enums";

type ReferralForPdf = Awaited<ReturnType<typeof getReferral>>;

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.35,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 3,
  },
  label: {
    fontWeight: "bold",
  },
  box: {
    border: "1 solid #222",
    padding: 8,
    marginTop: 4,
  },
  category: {
    marginTop: 6,
  },
  signature: {
    marginTop: 28,
    textAlign: "right",
  },
  small: {
    fontSize: 8,
    color: "#555",
  },
});

export async function renderReferralPdf(companyId: string, referralId: string) {
  const referral = await getReferral(companyId, referralId);
  return renderToBuffer(<ReferralDocument referral={referral} />);
}

function ReferralDocument({ referral }: { referral: ReferralForPdf }) {
  const hazardsByCategory = referral.hazardFactors.reduce(
    (acc, hazard) => {
      acc[hazard.category].push(hazard);
      return acc;
    },
    {
      PHYSICAL: [],
      DUST: [],
      CHEMICAL: [],
      BIOLOGICAL: [],
      OTHER: [],
    } as Record<HazardCategory, ReferralForPdf["hazardFactors"]>,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Skierowanie na badania lekarskie</Text>

        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Pracodawca: </Text>
            {referral.company.name}, {referral.company.address}
          </Text>
          <Text>
            <Text style={styles.label}>NIP: </Text>
            {referral.company.nip} <Text style={styles.label}>REGON: </Text>
            {referral.company.regon}
          </Text>
          <Text>
            <Text style={styles.label}>Miejscowość i data: </Text>
            {referral.issuedPlace}, {formatDate(referral.issuedAt)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Rodzaj badania: </Text>
            {referralTypeLabels[referral.type]}
          </Text>
          <Text>
            <Text style={styles.label}>Osoba kierowana: </Text>
            {referral.employeeNameSnapshot}
          </Text>
          <Text>
            <Text style={styles.label}>PESEL / dokument: </Text>
            {referral.employeePeselSnapshot ??
              referral.employeeIdentityDocumentSnapshot ??
              "brak danych"}
          </Text>
          {referral.employeeBirthDateSnapshot ? (
            <Text>
              <Text style={styles.label}>Data urodzenia: </Text>
              {formatDate(referral.employeeBirthDateSnapshot)}
            </Text>
          ) : null}
          <Text>
            <Text style={styles.label}>Adres zamieszkania: </Text>
            {referral.employeeAddressSnapshot}
          </Text>
          <Text>
            <Text style={styles.label}>Kontekst: </Text>
            {referral.employmentContext === "EMPLOYED"
              ? "osoba zatrudniona"
              : "osoba podejmująca pracę"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Stanowisko/stanowiska pracy: </Text>
            {referral.positionSnapshot}
          </Text>
          <View style={styles.box}>
            <Text style={styles.label}>Opis stanowiska</Text>
            <Text>{referral.positionDescription}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Opis warunków pracy</Text>
            <Text>{referral.workDescription}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Czynniki niebezpieczne, szkodliwe, uciążliwe i inne
          </Text>
          {hazardCategoryPdfOrder.map((category, index) => (
            <View key={category} style={styles.category}>
              <Text style={styles.label}>
                {roman(index + 1)}. {hazardCategoryLabels[category]}:
              </Text>
              {hazardsByCategory[category].length === 0 ? (
                <Text>-</Text>
              ) : (
                hazardsByCategory[category].map((hazard) => (
                  <Text key={hazard.id}>
                    - {hazard.factorNameSnapshot}; wielkość narażenia:{" "}
                    {hazard.exposureValue}; wyniki pomiarów:{" "}
                    {hazard.measurementResult ?? "nie dotyczy / brak pomiaru"}
                  </Text>
                ))
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Łączna liczba czynników: </Text>
            {referral.hazardFactors.length}
          </Text>
        </View>

        <Text style={styles.signature}>.............................................</Text>
        <Text style={styles.signature}>
          {referral.company.pdfSignatoryName ?? "podpis pracodawcy"}
        </Text>
        {referral.company.pdfSignatoryTitle ? (
          <Text style={styles.signature}>{referral.company.pdfSignatoryTitle}</Text>
        ) : null}
        <Text style={styles.small}>
          {referral.company.pdfFooterNote ??
            "Skierowanie wydaje się w dwóch egzemplarzach; jeden egzemplarz otrzymuje osoba kierowana na badania."}
        </Text>
      </Page>
    </Document>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pl-PL").format(date);
}

function roman(value: number) {
  return ["I", "II", "III", "IV", "V"][value - 1] ?? String(value);
}
