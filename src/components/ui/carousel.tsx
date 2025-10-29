"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselCoreProps = {
  orientation?: "horizontal" | "vertical";
};

type CarouselProps = React.PropsWithChildren<CarouselCoreProps> & {
  opts?: Parameters<typeof useEmblaCarousel>[0];
  plugins?: Parameters<typeof useEmblaCarousel>[1];
  setApi?: (api: UseEmblaCarouselType[1]) => void;
};

type CarouselContextProps = {
  emblaApi: UseEmblaCarouselType[1];
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselCoreProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      plugins,
      setApi,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: UseEmblaCarouselType[1]) => {
      if (!api) return; // Handle undefined api
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      emblaApi?.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
      emblaApi?.scrollNext();
    }, [emblaApi]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!emblaApi) {
        return;
      }

      setApi?.(emblaApi);
      emblaApi.on("select", onSelect);
      emblaApi.on("reInit", onSelect);

      return () => {
        emblaApi.off("select", onSelect);
        emblaApi.off("reInit", onSelect);
      };
    }, [emblaApi, onSelect, setApi]);

    return (
      <CarouselContext.Provider
        value={{
          emblaApi,
          canScrollPrev,
          canScrollNext,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        }}
      >
        <div
          ref={ref}
          onKeyDown={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          <div
            ref={emblaRef}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "flex",
                orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      onClick={scrollNext}
      disabled={!canScrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};