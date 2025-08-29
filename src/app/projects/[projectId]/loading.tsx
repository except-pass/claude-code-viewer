import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Skeleton className="h-9 w-32 mb-4" />
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="h-9 w-80" />
        </div>
        <Skeleton className="h-4 w-96" />
      </header>

      <main>
        <section>
          <Skeleton className="h-7 w-64 mb-4" />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}