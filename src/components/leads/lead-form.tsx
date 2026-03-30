"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { logActivity } from "@/lib/logger";

type Stage = { id: string; name: string; slug: string };
type Profile = { id: string; full_name: string | null; email: string };

const LEAD_SOURCES = ["LinkedIn", "Cold Call", "Email", "Referral", "Website", "Other"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "200-500", "500+"];
const BUDGET_RANGES = ["< 1L", "1-5L", "5-10L", "10L+"];
const TIMELINES = ["Immediate", "1-3 months", "3-6 months", "6+ months"];



export function LeadForm({
  stages,
  profiles,
  industries,
  departments,
  technologies,
  initialData,
  isEdit = false,
}: {
  stages: Stage[];
  profiles: Profile[];
  industries: string[];
  departments: string[];
  technologies: string[];
  initialData?: any;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResearch, setAiResearch] = useState<string>("");

  const [leadSource, setLeadSource] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [stageId, setStageId] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactLinkedIn, setContactLinkedIn] = useState("");
  const [contactTitle, setContactTitle] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLinkedIn, setCompanyLinkedIn] = useState("");
  const [industry, setIndustry] = useState("");
  const [department, setDepartment] = useState("");
  const [technology, setTechnology] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");

  const [requirements, setRequirements] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");

    useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.company_name || "");
      setCompanyWebsite(initialData.website || "");
      setStageId(initialData.stage_id || "");
      setRequirements(initialData.requirements || "");
    }
  }, [initialData]);

  async function handleGenerateResearch() {
    if (!companyName.trim()) {
      toast.error("Enter company name first");
      return;
    }
    setAiLoading(true);
    setAiResearch("");
    try {
      const res = await fetch("/api/gemini-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), website: companyWebsite.trim() || undefined }),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        toast.error(data.error || "Failed to generate research");
        setAiLoading(false);
        return;
      }
      setAiResearch(data.research ?? "");
      toast.success("Research generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    }
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Company name required");
      return;
    }

    setLoading(true);

    // 🔥 EDIT MODE
    if (isEdit && initialData?.id) {
      const res = await fetch(`/api/leads/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          website: companyWebsite,
          stage_id: stageId,
          requirements,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Update failed");
        setLoading(false);
        return;
      }

      toast.success("Lead updated ✅");
    } 
    // 🔥 CREATE MODE
    else {
      const { error } = await supabase.from("leads").insert({
        company_name: companyName,
        website: companyWebsite,
        stage_id: stageId,
        requirements,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success("Lead created ✅");
    }

    router.push("/leads");
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select value={leadSource} onValueChange={setLeadSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-4 pt-2">
                {(["high", "medium", "low"] as const).map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                      className="rounded-full"
                    />
                    <span className="capitalize">{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Contact Name *</Label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91..." />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={contactLinkedIn} onChange={(e) => setContactLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="space-y-2">
              <Label>Designation / Title</Label>
              <Input value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} placeholder="e.g. CTO" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." required />
            </div>
            <div className="space-y-2">
              <Label>Company Website</Label>
              <Input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company LinkedIn</Label>
            <Input value={companyLinkedIn} onChange={(e) => setCompanyLinkedIn(e.target.value)} placeholder="https://linkedin.com/company/..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Technology Stack</Label>
              <Select value={technology} onValueChange={setTechnology}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technology" />
                </SelectTrigger>
                <SelectContent>
                  {technologies.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location / City</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bangalore" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Requirements / What they need</Label>
            <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Brief requirements..." rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget Range</Label>
              <Select value={budgetRange} onValueChange={setBudgetRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timeline</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {companyName.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Research</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" onClick={handleGenerateResearch} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              🤖 Generate AI Research
            </Button>
            {aiResearch && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap read-only">
                {aiResearch}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create lead"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
