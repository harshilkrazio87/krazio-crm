import { StickyNote } from "lucide-react";

export default function StickyNotesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <StickyNote className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold">Sticky Notes</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Open the sticky notes panel from the button in the header (next to the bell icon) to view and manage your notes from anywhere.
      </p>
    </div>
  );
}
