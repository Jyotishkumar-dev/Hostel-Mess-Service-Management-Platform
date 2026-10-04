/**
 * Admin read side for the complaint register and the staff directory.
 *
 * Admin is the only role that can read every complaint (see the
 * `complaints_select_admin` policy in migration 0002), so these queries are
 * unconstrained apart from that guard in `requireRole`.
 */
import "server-only";

import { cache } from "react";
import { createTypedServerClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth/session";
import { STAFF_COMPLAINT_SELECT, mapComplaintRows } from "@/lib/complaints/queries";
import type { ComplaintWithStaff } from "@/lib/complaints/mapper";
import type { Complaint } from "@/types/complaint";
import type { Profile } from "@/types/auth";

const NOT_CONFIGURED =
  "Storage is not connected yet. Add your Supabase keys to .env.local to enable this view.";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Every complaint on campus, newest first. */
export const listAllComplaints = cache(
  async (): Promise<Result<Complaint[]>> => {
    const supabase = await createTypedServerClient();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };

    // requireRole runs inside the data path so a non-admin is redirected before
    // the query is even issued.
    const user = await requireRole("admin");
    void user;

    const { data, error } = await supabase
      .from("complaints")
      .select(STAFF_COMPLAINT_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin] list failed:", error.message);
      return {
        ok: false,
        error: "We could not load the issue register right now.",
      };
    }

    return mapComplaintRows(supabase, (data ?? []) as ComplaintWithStaff[]);
  },
);

/** A single complaint, for the admin issue detail page. */
export const getAdminComplaint = cache(
  async (id: string): Promise<Result<Complaint | null>> => {
    const supabase = await createTypedServerClient();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };

    await requireRole("admin");

    const { data, error } = await supabase
      .from("complaints")
      .select(STAFF_COMPLAINT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[admin] get failed:", error.message);
      return {
        ok: false,
        error: "We could not open that issue right now.",
      };
    }

    if (!data) return { ok: true, data: null };

    const mapped = await mapComplaintRows(supabase, [data as ComplaintWithStaff]);
    if (!mapped.ok) return mapped;
    return { ok: true, data: mapped.data[0] ?? null };
  },
);

export type StaffOption = { id: string; name: string; role: string };

/** The support staff an admin can assign issues to. */
export const listStaffProfiles = cache(
  async (): Promise<Result<StaffOption[]>> => {
    const supabase = await createTypedServerClient();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };

    await requireRole("admin");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("role", "staff")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("[admin] staff directory failed:", error.message);
      return { ok: false, error: "We could not load the staff directory." };
    }

    const rows = (data ?? []) as Pick<Profile, "id" | "full_name" | "role">[];
    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.full_name,
        role: row.role,
      })),
    };
  },
);
