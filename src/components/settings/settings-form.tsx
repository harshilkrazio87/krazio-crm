"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";

export function SettingsForm() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Dark and light mode. Logo upload is available in Admin.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Label>Theme</Label>
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">{theme ?? "system"}</span>
        </CardContent>
      </Card>
    </div>
  );
}
