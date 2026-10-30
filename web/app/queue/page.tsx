import type { Metadata } from "next";
import { QueueView } from "@/components/queue-view";

export const metadata: Metadata = {
  title: "Queue · PolyAgent",
};

export default function QueuePage() {
  return <QueueView />;
}
