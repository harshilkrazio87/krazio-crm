"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Note = {
  id: string;
  title: string | null;
  content: string | null;
  color: string;
  created_at?: string;
};

const COLORS = ["yellow", "pink", "blue", "green", "purple"];
const COLOR_HEX: Record<string, string> = {
  yellow: "#FEF08A",
  pink: "#FBCFE8",
  blue: "#BAE6FD",
  green: "#BBF7D0",
  purple: "#E9D5FF",
};

export function StickyNotesPanel() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteCount, setNoteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("yellow");
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
      const userId = profile?.id ?? user.id;
      const { count } = await supabase
        .from("sticky_notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      setNoteCount(count ?? 0);
    };
    fetchCount();
  }, [open, notes.length]);

  useEffect(() => {
    if (!open) return;
    const fetchNotes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
      const userId = profile?.id ?? user.id;
      const { data } = await supabase
        .from("sticky_notes")
        .select("id, title, content, color, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setNotes((data as Note[]) ?? []);
      setLoading(false);
    };
    setLoading(true);
    fetchNotes();
  }, [open]);

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
        color: newColor,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create note");
      return;
    }
    setNotes((prev) => [data as Note, ...prev]);
    setNewTitle("");
    setNewContent("");
    setNewColor("yellow");
    setAdding(false);
    toast.success("Note added");
  }

  async function updateNote(id: string, updates: Partial<Note>) {
    const { error } = await supabase.from("sticky_notes").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    setEditingId(null);
  }

  async function deleteNote(id: string) {
    const { error } = await supabase.from("sticky_notes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Note deleted");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Sticky notes">
          <StickyNote className="h-4 w-4" />
          {noteCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {noteCount > 99 ? "99+" : noteCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[380px] sm:w-[380px] max-w-[95vw]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Sticky Notes
            {noteCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({noteCount})</span>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto mt-4">
          <Button onClick={() => setAdding(true)} variant="outline" size="sm" className="mb-4 w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
          {adding && (
            <div className="mb-4 p-3 rounded-lg border bg-card space-y-2">
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
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: COLOR_HEX[c] ?? COLOR_HEX.yellow }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createNote}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border p-3 min-h-[100px] relative group"
                  style={{ backgroundColor: COLOR_HEX[n.color] ?? COLOR_HEX.yellow }}
                >
                  {editingId === n.id ? (
                    <>
                      <Input
                        defaultValue={n.title ?? ""}
                        onBlur={(e) => updateNote(n.id, { title: e.target.value || null })}
                        className="mb-2 bg-white/80"
                      />
                      <Textarea
                        defaultValue={n.content ?? ""}
                        onBlur={(e) => updateNote(n.id, { content: e.target.value || null })}
                        rows={3}
                        className="mb-2 bg-white/80"
                      />
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Done
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-sm flex-1 min-w-0 truncate">{n.title || "Untitled"}</h3>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => window.confirm("Delete this note?") && deleteNote(n.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p
                        className="text-sm mt-1 whitespace-pre-wrap cursor-text min-h-[2em]"
                        onClick={() => setEditingId(n.id)}
                      >
                        {n.content || "Click to edit…"}
                      </p>
                      <div className="flex gap-1 mt-2 justify-between items-end">
                        <span className="text-[10px] text-muted-foreground">
                          {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ""}
                        </span>
                        <div className="flex gap-1">
                          {COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className="w-3 h-3 rounded-full border border-slate-300"
                              style={{ backgroundColor: COLOR_HEX[c] }}
                              onClick={() => updateNote(n.id, { color: c })}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {!loading && notes.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground py-4">No notes. Click &quot;New Note&quot; to add one.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
