import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Status = "unknown" | "ok" | "fail";

type HealthResult = {
  googleBooks: boolean;
  mongodb: boolean;
};

const circleClasses: Record<Status, string> = {
  ok: "bg-green-500",
  fail: "bg-red-500",
  unknown: "bg-muted",
};

const labelClasses: Record<Status, string> = {
  ok: "text-green-600",
  fail: "text-red-600",
  unknown: "text-muted-foreground",
};

export function StatusFooter() {
  const [internetStatus, setInternetStatus] = useState<Status>(() => (typeof navigator !== "undefined" && navigator.onLine ? "ok" : "fail"));
  const [googleStatus, setGoogleStatus] = useState<Status>("unknown");
  const [mongoStatus, setMongoStatus] = useState<Status>("unknown");

  const items = useMemo(
    () => [
      { label: "Internet", status: internetStatus },
      { label: "Google Books", status: googleStatus },
      { label: "MongoDB", status: mongoStatus },
    ],
    [internetStatus, googleStatus, mongoStatus]
  );

  useEffect(() => {
    function handleOnline() {
      setInternetStatus("ok");
    }
    function handleOffline() {
      setInternetStatus("fail");
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function runHealthCheck() {
    try {
      const resp = await fetch("/api/health", { cache: "no-store" });
      if (!resp.ok) {
        setGoogleStatus("fail");
        setMongoStatus("fail");
        return;
      }
      const body: HealthResult = await resp.json();
      setGoogleStatus(body.googleBooks ? "ok" : "fail");
      setMongoStatus(body.mongodb ? "ok" : "fail");
    } catch {
      setGoogleStatus("fail");
      setMongoStatus("fail");
    }
  }

  useEffect(() => {
    runHealthCheck();
    const id = setInterval(runHealthCheck, 20000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-6 text-sm">
        {items.map(({ label, status }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block w-3 h-3 rounded-full border border-border transition-colors",
                circleClasses[status]
              )}
              aria-label={`${label} status ${status}`}
            />
            <span className={cn("text-xs font-medium", labelClasses[status])}>{label}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}

