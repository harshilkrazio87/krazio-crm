"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Note = {
  id: string;
  title: string | null;
  content: string | null;
  color: string;
  position_x: number;
  position_y: number;
};

const COLORS = ["yellow", "green", "blue", "pink", "purple"];

export function StickyNotesBoard({ initialNotes }: { initialNotes: Note[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function createNote() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    const { data, error } = await supabase
      .from("sticky_notes")
      .insert({
        user_id: profile?.id ?? user.id,
        title: newTitle.trim() || null,
        content: newContent.trim() || null,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create note");
      return;
    }
    setNotes((prev) => [data, ...prev]);
    setNewTitle("");
    setNewContent("");
    setAdding(false);
    router.refresh();
  }

  async function updateNote(id: string, updates: Partial<Note>) {
    const { error } = await supabase
      .from("sticky_notes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    setEditingId(null);
    router.refresh();
  }

  async function deleteNote(id: string) {
    const { error } = await supabase.from("sticky_notes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setAdding(true)} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New note
      </Button>
      {adding && (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-6 space-y-2">
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={createNote}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((n) => (
          <Card
            key={n.id}
            className={`bg-${n.color}-100 dark:bg-${n.color}-900/20 border-${n.color}-300`}
            style={{
              backgroundColor: n.color === "yellow" ? "hsl(48 96% 89%)" : n.color === "green" ? "hsl(142 76% 91%)" : n.color === "blue" ? "hsl(214 95% 93%)" : n.color === "pink" ? "hsl(330 81% 94%)" : "hsl(270 70% 94%)",
              borderColor: n.color === "yellow" ? "hsl(48 96% 70%)" : undefined,
            }}
          >
            <CardContent className="pt-4">
              {editingId === n.id ? (
                <>
                  <Input
                    defaultValue={n.title ?? ""}
                    onBlur={(e) => updateNote(n.id, { title: e.target.value || null })}
                    className="mb-2"
                  />
                  <Textarea
                    defaultValue={n.content ?? ""}
                    onBlur={(e) => updateNote(n.id, { content: e.target.value || null })}
                    rows={4}
                    className="mb-2"
                  />
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{n.title || "Untitled"}</h3>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(n.id)}>
                        Edit
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteNote(n.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{n.content || "—"}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {notes.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No sticky notes. Click &quot;New note&quot; to add one.</p>
      )}
    </div>
  );
}
