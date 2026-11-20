import type { Metadata } from "next";
import { CreditCard } from "lucide-react";

import { getMyMembership } from "@/lib/api/memberships";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import {
  MembershipPageShell,
  MembershipSummary,
} from "@/components/membership/membership-summary";
import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import type { Membership } from "@/lib/types/memberships";

export const metadata: Metadata = { title: "Mi membresía" };

export default async function MembershipPage() {
  await requireRole(["MIEMBRO"]);

  let membership: Membership | null = null;
  let error: string | null = null;

  try {
    membership = await getMyMembership();
  } catch (cause) {
    logActionError("GET /api/memberships/me", cause);
    error = describeApiError(cause, "No pudimos cargar el estado de tu membresía.");
  }

  return (
    <MembershipPageShell>
      {error ? (
        <RetryError title="No pudimos cargar tu membresía" description={error} />
      ) : membership ? (
        <MembershipSummary membership={membership} />
      ) : (
        <EmptyState
          title="Aún no tienes una membresía"
          description="Acércate a recepción para registrar tu primera membresía o renovar la anterior."
          icon={CreditCard}
        />
      )}
    </MembershipPageShell>
  );
}
