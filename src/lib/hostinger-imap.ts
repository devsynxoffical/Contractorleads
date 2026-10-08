import {
  syncMailboxImap,
  syncUserInboxes,
  type ImapSyncResult,
  type SyncMailboxOptions,
} from "@/lib/inbox-sync";

export type { ImapSyncResult, SyncMailboxOptions };
export { syncMailboxImap };

/**
 * Backward-compatible helper to sync user's assigned mailboxes (both Hostinger and GoDaddy).
 */
export async function syncUserHostingerMailboxes(
  userId: string,
  opts?: { fetchAll?: boolean; limit?: number },
): Promise<{
  totalSynced: number;
  results: ImapSyncResult[];
  mailboxesCount?: number;
}> {
  return syncUserInboxes(userId, {
    fetchAll: opts?.fetchAll ?? true,
    limitPerMailbox: opts?.limit ?? 50,
  });
}

