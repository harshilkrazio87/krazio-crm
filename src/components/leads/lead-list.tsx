"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type LeadRow = {
  id: string;
  company_name: string | null;
  website: string | null;
  stage_id: string | null;
  created_at: string;
  lead_stages?: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

type Stage = { id: string; name: string; slug: string; order_index: number };



export function LeadList({ leads, stages }: { leads: LeadRow[]; stages: Stage[] }) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log(response);
        toast.success("Lead deleted successfully");
        router.refresh();
      } else {
        toast.error("Failed to delete lead");
      }
    } catch (error) {
      toast.error("Error deleting lead");
    }
  };

  if (!leads.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <p>No leads yet.</p>
          <Link href="/leads/new" className="text-primary hover:underline mt-2">
            Add your first lead
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
  {leads.map((lead) => (
    <Card key={lead.id} className="transition-colors hover:bg-accent/50">
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4">
        
        {/* LEFT CONTENT */}
        <Link href={`/leads/${lead.id}`} className="flex-1 min-w-0">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">
              {lead.company_name || "Unnamed"}
            </h3>

            {lead.website && (
              <p className="text-sm text-muted-foreground truncate">
                {lead.website}
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(lead.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </Link>

        {/* RIGHT CONTENT */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="secondary" className="whitespace-nowrap">
            {Array.isArray(lead.lead_stages)
              ? lead.lead_stages[0]?.name
              : lead.lead_stages?.name ?? "No stage"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/leads/${lead.id}/edit`);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(lead.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

  );
}