"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Registration unavailable</CardTitle>
        <CardDescription>
          Registration is not available. Please contact your administrator for access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Access to this CRM is by invitation only. If you need an account, contact your administrator.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/login">Back to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
