import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Skeleton className="h-9 w-32 mb-4" />
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-4 w-80" />
      </header>

      <main>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="flex justify-center pt-4">
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}