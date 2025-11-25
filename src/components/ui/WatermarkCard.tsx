"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WatermarkCard({ label, status }: { label: string; status: string }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>

      <CardContent>
        <Badge variant="secondary">{status}</Badge>
      </CardContent>
    </Card>
  );
}
