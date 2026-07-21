"use client";

import { RouteError } from "@/app/error-ui";

export default function ErrorBoundary(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={props.error}
      reset={props.reset}
      title="Lỗi tải giao diện Booster"
      homeHref="/booster"
    />
  );
}
