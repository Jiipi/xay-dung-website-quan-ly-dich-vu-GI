"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reveal } from "@/components/animations/Reveal";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar?: string;
  company?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
}

export function TestimonialCarousel({
  testimonials,
  autoplay = true,
  autoplayInterval = 6000,
  className,
}: TestimonialCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    duration: 30,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollSnaps = useMemo(
    () => testimonials.map((_, idx) => idx),
    [testimonials]
  );

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!autoplay || !emblaApi) return;
    const id = window.setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, autoplayInterval);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayInterval, emblaApi]);

  return (
    <section
      className={cn(
        "relative w-full px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32",
        className
      )}
    >
      <div className="mx-auto max-w-4xl">
        <Reveal>
        <div className="overflow-hidden rounded-3xl border border-white/10 glass p-6 sm:p-10 md:p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex"
          >
            <Quote
              className="size-8 text-gradient-brand sm:size-10"
              aria-hidden
            />
          </motion.div>

          <div ref={emblaRef} className="mt-6 -mx-2">
            <div className="flex">
              {testimonials.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="min-w-0 shrink-0 grow-0 basis-full px-2"
                  aria-roledescription="slide"
                  aria-label={`Đánh giá ${idx + 1} / ${testimonials.length}`}
                >
                  <div className="flex items-center gap-1 text-brand-amber">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden
                        className={cn(
                          "size-4 sm:size-5",
                          i < item.rating
                            ? "fill-current"
                            : "fill-transparent opacity-30"
                        )}
                      />
                    ))}
                  </div>

                  <p className="mt-5 font-heading text-lg leading-relaxed text-white sm:text-xl md:text-2xl">
                    “{item.content}”
                  </p>

                  <div className="mt-6 flex items-center gap-4">
                    <Avatar size="lg" className="size-12">
                      {item.avatar ? (
                        <AvatarImage src={item.avatar} alt={item.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-brand text-sm font-semibold text-white">
                        {item.name
                          .split(" ")
                          .map((part) => part.charAt(0))
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-white sm:text-base">
                        {item.name}
                      </p>
                      <p className="text-xs text-white/70 sm:text-sm">
                        {item.role}
                        {item.company ? ` • ${item.company}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              {scrollSnaps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollTo(idx)}
                  aria-label={`Chuyển tới đánh giá ${idx + 1}`}
                  aria-current={idx === selectedIndex}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === selectedIndex
                      ? "w-8 bg-brand-amber"
                      : "w-2 bg-white/30 hover:bg-white/60"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={scrollPrev}
                aria-label="Đánh giá trước"
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full border border-white/20",
                  "bg-white/5 text-white transition-all hover-lift",
                  "hover:border-white/50 hover:bg-white/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                )}
              >
                <ArrowLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                aria-label="Đánh giá tiếp theo"
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full border border-white/20",
                  "bg-white/5 text-white transition-all hover-lift",
                  "hover:border-white/50 hover:bg-white/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                )}
              >
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}

export default TestimonialCarousel;
