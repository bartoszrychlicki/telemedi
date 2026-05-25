import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { db } from "../src/lib/db";
import { env } from "../src/lib/env";
import type {
  HazardCategory,
  ReferralAttentionReason,
  ReferralStatus,
  ReferralType,
  UserRole,
} from "../src/generated/prisma/enums";

type EmployeeSeed = {
  firstName: string;
  lastName: string;
  pesel: string;
  position: string;
  email: string;
  phone: string;
  address: string;
};

type HazardSeed = { category: HazardCategory; name: string };

const companyDemo = {
  name: "Polskie Zakłady Mechaniczne sp. z o.o.",
  shortName: "PZM Polska",
  nip: "5252556789",
  regon: "146789012",
  address: "ul. Przemysłowa 14, 02-232 Warszawa",
  contactPhone: "+48 22 456 78 90",
  contactEmail: "kadry@pzm.pl",
  pdfIssuedPlace: "Warszawa",
  pdfSignatoryName: "Barbara Wójcik",
  pdfSignatoryTitle: "Koordynator ds. medycyny pracy",
  pdfFooterNote:
    "Dokument wygenerowany w portalu Telemedi Medycyna Pracy. Skierowanie wydaje się w dwóch egzemplarzach.",
};

const employees: EmployeeSeed[] = [
  {
    firstName: "Anna",
    lastName: "Kowalska",
    pesel: "85010112345",
    position: "Operator CNC",
    email: "a.kowalska@pzm.pl",
    phone: "+48 601 234 567",
    address: "ul. Świerkowa 12/4, 02-432 Warszawa",
  },
  {
    firstName: "Piotr",
    lastName: "Nowak",
    pesel: "78110823456",
    position: "Spawacz",
    email: "p.nowak@pzm.pl",
    phone: "+48 602 345 678",
    address: "ul. Ogrodowa 5, 03-123 Warszawa",
  },
  {
    firstName: "Małgorzata",
    lastName: "Wiśniewska",
    pesel: "92041567892",
    position: "Magazynier",
    email: "m.wisniewska@pzm.pl",
    phone: "+48 603 456 789",
    address: "ul. Kwiatowa 8/2, 02-789 Warszawa",
  },
  {
    firstName: "Tomasz",
    lastName: "Kamiński",
    pesel: "81052311234",
    position: "Operator wózka widłowego",
    email: "t.kaminski@pzm.pl",
    phone: "+48 604 567 890",
    address: "ul. Słoneczna 22, 04-567 Warszawa",
  },
  {
    firstName: "Krystyna",
    lastName: "Lewandowska",
    pesel: "74021998765",
    position: "Księgowa",
    email: "k.lewandowska@pzm.pl",
    phone: "+48 605 678 901",
    address: "ul. Parkowa 3/15, 02-345 Warszawa",
  },
  {
    firstName: "Marek",
    lastName: "Zieliński",
    pesel: "83071456789",
    position: "Operator CNC",
    email: "m.zielinski@pzm.pl",
    phone: "+48 606 789 012",
    address: "ul. Lipowa 14, 03-456 Warszawa",
  },
  {
    firstName: "Jolanta",
    lastName: "Szymańska",
    pesel: "69123012345",
    position: "Specjalista BHP",
    email: "j.szymanska@pzm.pl",
    phone: "+48 607 890 123",
    address: "ul. Klonowa 7, 02-678 Warszawa",
  },
  {
    firstName: "Rafał",
    lastName: "Woźniak",
    pesel: "90060587654",
    position: "Mechanik",
    email: "r.wozniak@pzm.pl",
    phone: "+48 608 901 234",
    address: "ul. Brzozowa 11/8, 04-123 Warszawa",
  },
  {
    firstName: "Beata",
    lastName: "Dąbrowska",
    pesel: "77081523456",
    position: "Specjalista ds. jakości",
    email: "b.dabrowska@pzm.pl",
    phone: "+48 609 012 345",
    address: "ul. Akacjowa 9, 03-789 Warszawa",
  },
  {
    firstName: "Andrzej",
    lastName: "Mazur",
    pesel: "65040876543",
    position: "Kierownik produkcji",
    email: "a.mazur@pzm.pl",
    phone: "+48 610 123 456",
    address: "ul. Topolowa 21/3, 02-901 Warszawa",
  },
  {
    firstName: "Iwona",
    lastName: "Krawczyk",
    pesel: "86112234567",
    position: "Pracownik administracji",
    email: "i.krawczyk@pzm.pl",
    phone: "+48 611 234 567",
    address: "ul. Cicha 4, 02-123 Warszawa",
  },
  {
    firstName: "Grzegorz",
    lastName: "Kaczmarek",
    pesel: "79030987654",
    position: "Spawacz",
    email: "g.kaczmarek@pzm.pl",
    phone: "+48 612 345 678",
    address: "ul. Polna 18, 04-890 Warszawa",
  },
  {
    firstName: "Halina",
    lastName: "Piotrowska",
    pesel: "71092145678",
    position: "Specjalista HR",
    email: "h.piotrowska@pzm.pl",
    phone: "+48 613 456 789",
    address: "ul. Wiosenna 6/12, 02-567 Warszawa",
  },
  {
    firstName: "Sławomir",
    lastName: "Grabowski",
    pesel: "82061234567",
    position: "Elektryk",
    email: "s.grabowski@pzm.pl",
    phone: "+48 614 567 890",
    address: "ul. Letnia 13, 03-234 Warszawa",
  },
  {
    firstName: "Ewa",
    lastName: "Jankowska",
    pesel: "88040976543",
    position: "Operator wtryskarki",
    email: "e.jankowska@pzm.pl",
    phone: "+48 615 678 901",
    address: "ul. Jesienna 25, 02-345 Warszawa",
  },
];

const systemHazards: HazardSeed[] = [
  { category: "PHYSICAL", name: "Hałas" },
  { category: "PHYSICAL", name: "Wibracje miejscowe" },
  { category: "PHYSICAL", name: "Wibracje ogólne" },
  { category: "PHYSICAL", name: "Promieniowanie jonizujące" },
  { category: "PHYSICAL", name: "Promieniowanie elektromagnetyczne" },
  { category: "PHYSICAL", name: "Mikroklimat gorący" },
  { category: "PHYSICAL", name: "Mikroklimat zimny" },
  { category: "PHYSICAL", name: "Praca przy monitorze ekranowym" },
  { category: "PHYSICAL", name: "Praca na wysokości powyżej 3 m" },
  { category: "CHEMICAL", name: "Rozpuszczalniki organiczne" },
  { category: "CHEMICAL", name: "Pary kwasów" },
  { category: "CHEMICAL", name: "Gazy spawalnicze" },
  { category: "CHEMICAL", name: "Tlenek węgla" },
  { category: "CHEMICAL", name: "Substancje rakotwórcze" },
  { category: "BIOLOGICAL", name: "Czynniki biologiczne grupy 2" },
  { category: "BIOLOGICAL", name: "Czynniki biologiczne grupy 3" },
  { category: "DUST", name: "Pył metalowy" },
  { category: "DUST", name: "Pył spawalniczy" },
  { category: "DUST", name: "Pył drzewny" },
  { category: "DUST", name: "Pył krzemionkowy" },
  { category: "OTHER", name: "Praca wymagająca dźwigania powyżej 25 kg" },
  { category: "OTHER", name: "Wymuszona pozycja ciała" },
  { category: "OTHER", name: "Praca zmianowa / nocna" },
  { category: "OTHER", name: "Stres zawodowy" },
];

const companyHazards: HazardSeed[] = [
  { category: "PHYSICAL", name: "Praca w warunkach narażenia na poślizg" },
  { category: "CHEMICAL", name: "Olej obróbkowy MecaCool 2000" },
  { category: "OTHER", name: "Obsługa wózka widłowego" },
  { category: "PHYSICAL", name: "Promieniowanie UV przy spawaniu" },
];

async function main() {
  if (!env.DEMO_SEED_ENABLED) {
    console.log("Demo seed disabled.");
    return;
  }

  const admin = await upsertUser({
    email: env.TELEMEDI_ADMIN_EMAIL,
    password: env.TELEMEDI_ADMIN_PASSWORD,
    name: "Admin Telemedi",
    appRole: "SUPER_ADMIN",
  });

  const organization = await db.organization.upsert({
    where: { slug: "demo-wedel" },
    create: {
      id: `org_${randomUUID()}`,
      name: companyDemo.name,
      slug: "demo-wedel",
      createdAt: new Date("2026-05-01T08:00:00.000Z"),
      metadata: JSON.stringify({ demo: true, shortName: companyDemo.shortName }),
    },
    update: {
      name: companyDemo.name,
      metadata: JSON.stringify({ demo: true, shortName: companyDemo.shortName }),
    },
  });

  await db.invitation.deleteMany({ where: { organizationId: organization.id } });

  const company = await db.company.upsert({
    where: { orgId: organization.id },
    create: {
      ...companyDemo,
      orgId: organization.id,
    },
    update: companyDemo,
  });

  await upsertMember(organization.id, admin.id, "owner");

  const coordinator = await upsertUser({
    email: env.TELEMEDI_COORDINATOR_EMAIL,
    password: env.TELEMEDI_COORDINATOR_PASSWORD,
    name: "Barbara Wójcik",
    appRole: "COORDINATOR",
    companyId: company.id,
  });

  const hr = await upsertUser({
    email: env.TELEMEDI_HR_EMAIL,
    password: env.TELEMEDI_HR_PASSWORD,
    name: "Halina Piotrowska",
    appRole: "HR_STAFF",
    companyId: company.id,
  });

  await upsertMember(organization.id, coordinator.id, "owner");
  await upsertMember(organization.id, hr.id, "member");

  await seedHazards(company.id);
  await db.referral.deleteMany({ where: { companyId: company.id } });
  const employeeByEmail = await seedEmployees(company.id);
  const hazardByName = await getHazardMap(company.id);
  await seedTemplates(company.id, hazardByName);
  await seedReferrals(company.id, coordinator.id, employeeByEmail, hazardByName);

  console.log("Seed complete:", {
    admin: admin.email,
    coordinator: coordinator.email,
    hr: hr.email,
    company: company.name,
  });
}

async function upsertUser(input: {
  email: string;
  password: string;
  name: string;
  appRole: UserRole;
  companyId?: string;
}) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  const password = await hashPassword(input.password);

  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          appRole: input.appRole,
          companyId: input.companyId ?? null,
          emailVerified: true,
        },
      })
    : await db.user.create({
        data: {
          id: `usr_${randomUUID()}`,
          email: input.email,
          name: input.name,
          emailVerified: true,
          appRole: input.appRole,
          companyId: input.companyId ?? null,
        },
      });

  await db.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: user.id,
      },
    },
    create: {
      id: `acc_${randomUUID()}`,
      providerId: "credential",
      accountId: user.id,
      userId: user.id,
      password,
    },
    update: {
      password,
    },
  });

  return user;
}

async function upsertMember(organizationId: string, userId: string, role: string) {
  await db.member.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    create: {
      id: `mem_${randomUUID()}`,
      organizationId,
      userId,
      role,
      createdAt: new Date(),
    },
    update: { role },
  });
}

async function seedHazards(companyId: string) {
  for (const hazard of systemHazards) {
    const existing = await db.hazardFactor.findFirst({
      where: { isSystem: true, category: hazard.category, name: hazard.name },
    });
    if (!existing) {
      await db.hazardFactor.create({
        data: { ...hazard, isSystem: true },
      });
    }
  }

  for (const hazard of companyHazards) {
    await db.hazardFactor.upsert({
      where: {
        companyId_category_name: {
          companyId,
          category: hazard.category,
          name: hazard.name,
        },
      },
      create: { ...hazard, companyId, isSystem: false },
      update: {},
    });
  }
}

async function seedEmployees(companyId: string) {
  await db.employee.deleteMany({
    where: {
      companyId,
      email: { notIn: employees.map((employee) => employee.email) },
    },
  });

  const result = new Map<
    string,
    {
      id: string;
      firstName: string;
      lastName: string;
      pesel: string | null;
      birthDate: Date | null;
      address: string;
      position: string;
      email: string;
    }
  >();

  for (const employee of employees) {
    const record = await db.employee.upsert({
      where: {
        companyId_email: {
          companyId,
          email: employee.email,
        },
      },
      create: {
        ...employee,
        companyId,
      },
      update: {
        ...employee,
        archivedAt: null,
      },
    });
    result.set(record.email, record);
  }

  return result;
}

async function getHazardMap(companyId: string) {
  const hazards = await db.hazardFactor.findMany({
    where: { OR: [{ isSystem: true }, { companyId }] },
  });

  return new Map(hazards.map((hazard) => [hazard.name, hazard]));
}

async function seedTemplates(
  companyId: string,
  hazardByName: Awaited<ReturnType<typeof getHazardMap>>,
) {
  const templates = [
    {
      name: "Operator CNC - hala produkcyjna",
      positionDescription:
        "Obsługa centrum obróbczego CNC, programowanie i nadzór procesu skrawania. Praca z metalami, narażenie na pył i hałas.",
      workDescription:
        "Hala produkcyjna 1200 m2, wentylacja mechaniczna. Praca stojąca, okresowe dźwiganie detali do 15 kg.",
      hazards: [
        ["Hałas", "82-88 dB przez 6 godzin na zmianie"],
        ["Pył metalowy", "kontakt okresowy przy obróbce"],
        ["Wibracje miejscowe", "obsługa narzędzi ręcznych do 2 godzin"],
        ["Praca zmianowa / nocna", "system dwuzmianowy"],
        ["Wymuszona pozycja ciała", "pozycja stojąca przez większość zmiany"],
      ],
    },
    {
      name: "Spawacz",
      positionDescription:
        "Spawanie metodą MIG/MAG, prace montażowe konstrukcji stalowych i obsługa stanowiska spawalniczego.",
      workDescription:
        "Stanowisko spawalnicze z odciągiem miejscowym, praca stojąca i kuczna, okresowe prace w osłonie.",
      hazards: [
        ["Pył spawalniczy", "narażenie w czasie spawania"],
        ["Gazy spawalnicze", "narażenie w czasie spawania"],
        ["Hałas", "do 85 dB"],
        ["Promieniowanie UV przy spawaniu", "ekspozycja przy łuku spawalniczym"],
        ["Wymuszona pozycja ciała", "praca w pozycji stojącej i kucznej"],
      ],
    },
    {
      name: "Pracownik biurowy",
      positionDescription:
        "Praca administracyjna, obsługa dokumentacji, kontakt mailowy i telefoniczny.",
      workDescription:
        "Pomieszczenie biurowe, 8 godzin dziennie przy monitorze ekranowym.",
      hazards: [
        ["Praca przy monitorze ekranowym", "około 6-8 godzin dziennie"],
        ["Stres zawodowy", "okresowe spiętrzenie zadań"],
      ],
    },
    {
      name: "Magazynier z wózkiem widłowym",
      positionDescription:
        "Przyjmowanie i wydawanie towaru, kompletacja, obsługa wózka widłowego.",
      workDescription:
        "Magazyn wysokiego składowania, praca w hali o temperaturze 5-22 st. C.",
      hazards: [
        ["Obsługa wózka widłowego", "transport wewnętrzny do 2 ton"],
        ["Praca wymagająca dźwigania powyżej 25 kg", "okresowo"],
        ["Hałas", "ruch magazynowy"],
        ["Praca na wysokości powyżej 3 m", "kompletacja na antresoli"],
      ],
    },
  ];

  await db.template.deleteMany({
    where: {
      companyId,
      name: { notIn: templates.map((template) => template.name) },
    },
  });

  for (const templateSeed of templates) {
    const template = await db.template.upsert({
      where: {
        companyId_name: {
          companyId,
          name: templateSeed.name,
        },
      },
      create: {
        companyId,
        name: templateSeed.name,
        positionDescription: templateSeed.positionDescription,
        workDescription: templateSeed.workDescription,
      },
      update: {
        positionDescription: templateSeed.positionDescription,
        workDescription: templateSeed.workDescription,
      },
    });

    await db.templateHazard.deleteMany({ where: { templateId: template.id } });
    await db.templateHazard.createMany({
      data: templateSeed.hazards
        .map(([name, exposure]) => {
          const hazard = hazardByName.get(name);
          if (!hazard) {
            return null;
          }
          return {
            templateId: template.id,
            hazardFactorId: hazard.id,
            defaultExposureValue: exposure,
            defaultMeasurementResult: "brak aktualnego pomiaru / nie dotyczy",
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    });
  }
}

async function seedReferrals(
  companyId: string,
  createdById: string,
  employeeByEmail: Awaited<ReturnType<typeof seedEmployees>>,
  hazardByName: Awaited<ReturnType<typeof getHazardMap>>,
) {
  const referrals = [
    referralSeed({
      employeeEmail: "a.kowalska@pzm.pl",
      type: "PERIODIC",
      status: "SCHEDULED",
      attentionReason: "NONE",
      issuedAt: "2026-05-18",
      deadlineDate: "2026-06-15",
      facilityName: "Centrum Medyczne Damiana, ul. Wałbrzyska 46, Warszawa",
      appointmentDate: "2026-05-28T10:30:00.000Z",
      positionDescription:
        "Obsługa centrum obróbczego CNC, programowanie i nadzór procesu skrawania.",
      workDescription:
        "Hala produkcyjna 1200 m2, wentylacja mechaniczna. Praca stojąca.",
      hazards: ["Hałas", "Pył metalowy", "Wibracje miejscowe", "Praca zmianowa / nocna"],
    }),
    referralSeed({
      employeeEmail: "p.nowak@pzm.pl",
      type: "INITIAL",
      status: "SUBMITTED",
      attentionReason: "EMPLOYEE_UNREACHABLE",
      issuedAt: "2026-05-21",
      deadlineDate: "2026-05-30",
      positionDescription: "Spawanie metodą MIG/MAG konstrukcji stalowych.",
      workDescription: "Stanowisko spawalnicze z odciągiem miejscowym.",
      hazards: ["Pył spawalniczy", "Gazy spawalnicze", "Hałas", "Wymuszona pozycja ciała"],
    }),
    referralSeed({
      employeeEmail: "t.kaminski@pzm.pl",
      type: "CONTROL",
      status: "COMPLETED",
      attentionReason: "NONE",
      issuedAt: "2026-05-10",
      deadlineDate: "2026-06-25",
      facilityName: "LUX MED, ul. Postępu 21, Warszawa",
      appointmentDate: "2026-05-19T09:00:00.000Z",
      positionDescription: "Obsługa wózka widłowego i transport ładunków.",
      workDescription: "Magazyn wysokiego składowania.",
      hazards: ["Obsługa wózka widłowego", "Praca wymagająca dźwigania powyżej 25 kg", "Hałas"],
    }),
    referralSeed({
      employeeEmail: "k.lewandowska@pzm.pl",
      type: "PERIODIC",
      status: "CLOSED",
      attentionReason: "NONE",
      issuedAt: "2026-04-08",
      deadlineDate: "2026-05-10",
      facilityName: "Medicover, ul. Inflancka 4B, Warszawa",
      appointmentDate: "2026-04-22T14:00:00.000Z",
      positionDescription: "Prowadzenie ksiąg rachunkowych i rozliczeń.",
      workDescription: "Stanowisko biurowe, 8 godzin dziennie przy komputerze.",
      hazards: ["Praca przy monitorze ekranowym", "Stres zawodowy"],
    }),
    referralSeed({
      employeeEmail: "m.zielinski@pzm.pl",
      type: "PERIODIC",
      status: "SUBMITTED",
      attentionReason: "NONE",
      issuedAt: "2026-05-23",
      deadlineDate: "2026-07-01",
      positionDescription: "Obsługa centrum obróbczego CNC.",
      workDescription: "Hala produkcyjna, wentylacja mechaniczna.",
      hazards: ["Hałas", "Pył metalowy", "Wibracje miejscowe", "Praca zmianowa / nocna"],
    }),
    referralSeed({
      employeeEmail: "g.kaczmarek@pzm.pl",
      type: "PERIODIC",
      status: "SCHEDULED",
      attentionReason: "NONE",
      issuedAt: "2026-05-15",
      deadlineDate: "2026-06-12",
      facilityName: "enel-med, ul. Stawki 2, Warszawa",
      appointmentDate: "2026-05-29T11:15:00.000Z",
      positionDescription: "Spawanie elektryczne i gazowe konstrukcji stalowych.",
      workDescription: "Stanowisko spawalnicze z odciągiem miejscowym.",
      hazards: ["Pył spawalniczy", "Gazy spawalnicze", "Hałas", "Promieniowanie UV przy spawaniu"],
    }),
    referralSeed({
      employeeEmail: "r.wozniak@pzm.pl",
      type: "CONTROL",
      status: "SUBMITTED",
      attentionReason: "NEEDS_CORRECTION",
      issuedAt: "2026-05-22",
      deadlineDate: "2026-05-31",
      positionDescription: "Konserwacja i naprawa maszyn produkcyjnych.",
      workDescription: "Praca w hali, kanał serwisowy, dostęp do maszyn.",
      hazards: ["Hałas", "Olej obróbkowy MecaCool 2000", "Wymuszona pozycja ciała"],
    }),
    referralSeed({
      employeeEmail: "a.mazur@pzm.pl",
      type: "PERIODIC",
      status: "DRAFT",
      attentionReason: "NONE",
      issuedAt: "2026-05-24",
      deadlineDate: "2026-06-30",
      positionDescription: "Nadzór nad procesem produkcyjnym i zespołem.",
      workDescription: "Hala produkcyjna i stanowisko biurowe.",
      hazards: ["Hałas", "Stres zawodowy", "Praca przy monitorze ekranowym"],
    }),
  ];

  for (const seed of referrals) {
    const employee = employeeByEmail.get(seed.employeeEmail);
    if (!employee) {
      continue;
    }

    const referral = await db.referral.create({
      data: {
        companyId,
        employeeId: employee.id,
        type: seed.type,
        status: seed.status,
        attentionReason: seed.attentionReason,
        employeeNameSnapshot: `${employee.firstName} ${employee.lastName}`,
        employeePeselSnapshot: employee.pesel,
        employeeBirthDateSnapshot: employee.birthDate,
        employeeIdentityDocumentSnapshot: null,
        employeeAddressSnapshot: employee.address,
        employmentContext: seed.type === "INITIAL" ? "STARTING_WORK" : "EMPLOYED",
        positionSnapshot: employee.position,
        positionDescription: seed.positionDescription,
        workDescription: seed.workDescription,
        issuedPlace: companyDemo.pdfIssuedPlace,
        issuedAt: new Date(seed.issuedAt),
        deadlineDate: new Date(seed.deadlineDate),
        facilityName: seed.facilityName ?? null,
        appointmentDate: seed.appointmentDate
          ? new Date(seed.appointmentDate)
          : null,
        occupationalMedicineCertificateRef:
          seed.status === "CLOSED" ? "orz-demo-2026-04-22" : null,
        createdById,
        hazardFactors: {
          create: seed.hazards
            .map((name) => {
              const hazard = hazardByName.get(name);
              if (!hazard) {
                return null;
              }
              return {
                hazardFactorId: hazard.id,
                category: hazard.category,
                factorNameSnapshot: hazard.name,
                exposureValue: defaultExposureFor(name),
                measurementResult: "brak aktualnego pomiaru / nie dotyczy",
              };
            })
            .filter((value): value is NonNullable<typeof value> => Boolean(value)),
        },
      },
    });

    await seedStatusEvents(referral.id, seed.status, seed.attentionReason, createdById);
  }
}

function referralSeed(input: {
  employeeEmail: string;
  type: ReferralType;
  status: ReferralStatus;
  attentionReason: ReferralAttentionReason;
  issuedAt: string;
  deadlineDate: string;
  facilityName?: string;
  appointmentDate?: string;
  positionDescription: string;
  workDescription: string;
  hazards: string[];
}) {
  return input;
}

async function seedStatusEvents(
  referralId: string,
  status: ReferralStatus,
  attentionReason: ReferralAttentionReason,
  createdById: string,
) {
  const flow: ReferralStatus[] = ["SUBMITTED", "SCHEDULED", "COMPLETED", "CLOSED"];
  const endIndex = flow.indexOf(status);
  const events = status === "DRAFT" ? ["DRAFT"] : flow.slice(0, endIndex + 1);

  for (const [index, toStatus] of events.entries()) {
    await db.referralStatusEvent.create({
      data: {
        referralId,
        fromStatus: index === 0 ? null : (events[index - 1] as ReferralStatus),
        toStatus: toStatus as ReferralStatus,
        attentionReason: index === events.length - 1 ? attentionReason : "NONE",
        note:
          index === 0
            ? "Skierowanie wygenerowane w portalu HR."
            : "Status uzupełniony w panelu demonstracyjnym.",
        createdById,
      },
    });
  }
}

function defaultExposureFor(name: string) {
  const exposures: Record<string, string> = {
    Hałas: "82-88 dB przez 6 godzin na zmianie",
    "Pył metalowy": "kontakt okresowy przy obróbce",
    "Wibracje miejscowe": "obsługa narzędzi ręcznych do 2 godzin",
    "Praca zmianowa / nocna": "system dwuzmianowy",
    "Pył spawalniczy": "narażenie w czasie spawania",
    "Gazy spawalnicze": "narażenie w czasie spawania",
    "Wymuszona pozycja ciała": "pozycja stojąca lub kuczna",
    "Praca przy monitorze ekranowym": "około 6-8 godzin dziennie",
    "Stres zawodowy": "okresowe spiętrzenie zadań",
    "Obsługa wózka widłowego": "transport wewnętrzny do 2 ton",
    "Praca wymagająca dźwigania powyżej 25 kg": "okresowo",
    "Olej obróbkowy MecaCool 2000": "kontakt przez rękawice ochronne",
    "Promieniowanie UV przy spawaniu": "ekspozycja przy łuku spawalniczym",
    "Praca na wysokości powyżej 3 m": "okresowo podczas kompletacji",
  };

  return exposures[name] ?? "zgodnie z oceną ryzyka zawodowego";
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
