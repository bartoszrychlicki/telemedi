import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "node:path";

import { hazardCategoryLabels, hazardCategoryPdfOrder, referralTypeLabels } from "@/lib/constants";
import { getReferral } from "@/server/referral-service";
import type { HazardCategory } from "@/generated/prisma/enums";

type ReferralForPdf = Awaited<ReturnType<typeof getReferral>>;

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "NotoSans",
    fontWeight: 400,
    lineHeight: 1.35,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
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
    fontWeight: 700,
  },
  box: {
    border: "1 solid #222",
    padding: 8,
    marginTop: 4,
  },
  category: {
    marginTop: 8,
  },
  emptyCategory: {
    marginTop: 2,
  },
  hazardItem: {
    marginTop: 4,
    paddingLeft: 8,
  },
  hazardName: {
    marginBottom: 2,
  },
  hazardDetail: {
    marginLeft: 8,
    fontSize: 9,
  },
  signatureLine: {
    marginTop: 28,
    textAlign: "right",
  },
  signature: {
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
                <Text style={styles.emptyCategory}>-</Text>
              ) : (
                hazardsByCategory[category].map((hazard) => (
                  <View key={hazard.id} style={styles.hazardItem} wrap={false}>
                    <Text style={styles.hazardName}>
                      - {hazard.factorNameSnapshot}
                    </Text>
                    <Text style={styles.hazardDetail}>
                      <Text style={styles.label}>Wielkość narażenia: </Text>
                      {hazard.exposureValue}
                    </Text>
                    <Text style={styles.hazardDetail}>
                      <Text style={styles.label}>Wyniki pomiarów: </Text>
                      {hazard.measurementResult ?? "nie dotyczy / brak pomiaru"}
                    </Text>
                  </View>
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

        <Text style={styles.signatureLine}>.............................................</Text>
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
