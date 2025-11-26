import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function MarketCardSkeleton() {
  return (
    <Card className="overflow-visible">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-6 w-20 skeleton-shimmer rounded" />
          <div className="h-5 w-24 skeleton-shimmer rounded" />
        </div>
        
        <div className="h-7 w-full skeleton-shimmer rounded" />
        <div className="h-5 w-3/4 skeleton-shimmer rounded" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 skeleton-shimmer rounded" />
              <div className="h-4 w-12 skeleton-shimmer rounded" />
            </div>
            <div className="h-2.5 w-full skeleton-shimmer rounded-full" />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 skeleton-shimmer rounded" />
              <div className="h-4 w-12 skeleton-shimmer rounded" />
            </div>
            <div className="h-2.5 w-full skeleton-shimmer rounded-full" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <div className="h-4 w-8 skeleton-shimmer rounded" />
            <div className="h-4 w-16 skeleton-shimmer rounded" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <div className="h-10 flex-1 skeleton-shimmer rounded-md" />
        <div className="h-10 flex-1 skeleton-shimmer rounded-md" />
      </CardFooter>
    </Card>
  );
}
