import { redirect } from "next/navigation";

/** Legacy path — CRM setup now lives under /setup/crm */
export default function CrmWebhooksRedirect() {
  redirect("/setup/crm");
}
