import { db } from "@/lib/db";
import type { ReferralStatus } from "@/generated/prisma/enums";

const activeStatuses: ReferralStatus[] = ["SUBMITTED", "SCHEDULED", "COMPLETED"];

export async function getDashboard(companyId: string) {
  const now = new Date();
  const inTwoWeeks = new Date(now);
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

  const [
    employeeCount,
    activeReferralCount,
    attentionCount,
    scheduledCount,
    statusGroups,
    urgentReferrals,
    recentReferrals,
  ] = await Promise.all([
    db.employee.count({ where: { companyId, archivedAt: null } }),
    db.referral.count({
      where: { companyId, status: { in: activeStatuses } },
    }),
    db.referral.count({
      where: { companyId, attentionReason: { not: "NONE" } },
    }),
    db.referral.count({ where: { companyId, status: "SCHEDULED" } }),
    db.referral.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { _all: true },
    }),
    db.referral.findMany({
      where: {
        companyId,
        deadlineDate: { lte: inTwoWeeks },
        status: { in: ["SUBMITTED", "SCHEDULED"] },
      },
      orderBy: { deadlineDate: "asc" },
      take: 6,
      include: {
        hazardFactors: { select: { id: true } },
      },
    }),
    db.referral.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        hazardFactors: { select: { id: true } },
      },
    }),
  ]);

  return {
    stats: {
      employees: employeeCount,
      activeReferrals: activeReferralCount,
      needsAttention: attentionCount,
      scheduled: scheduledCount,
    },
    statusCounts: statusGroups.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count._all }),
      {} as Partial<Record<ReferralStatus, number>>,
    ),
    urgentReferrals,
    recentReferrals,
  };
}
