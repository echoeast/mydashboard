"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { LockIcon, FileTextIcon, DownloadIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ReportSection {
  id: string;
  type: "text" | "stat" | "image" | "file" | "divider";
  title: string;
  text_content: string | null;
  value: string | null;
  trend: string | null;
  file_url: string | null;
  file_name: string | null;
  order_index: number;
}

interface ReportMeta {
  id: string;
  title: string;
  client_name: string;
  period: string;
  brand_color: string | null;
}

interface BrandSettings {
  company_name: string;
  brand_color: string;
  logo_url: string | null;
}

export default function PublicReport() {
  const router = useRouter();
  const { id } = router.query;

  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [report, setReport] = useState<ReportMeta | null>(null);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    checkReport(id);
  }, [id]);

  async function checkReport(reportId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setError("Could not load report");
        return;
      }
      const data = await res.json();
      if (data.has_password) {
        setNeedsPassword(true);
      } else {
        await loadReport(reportId, "");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(reportId: string, pw: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load report");
        return;
      }
      setReport(data.report);
      setSections(data.sections);
      setBrand(data.brand);
      setNeedsPassword(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (typeof id === "string") loadReport(id, password);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <AlertCircleIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-lg font-semibold mb-2">Report not found</h1>
          <p className="text-sm text-muted-foreground">This link may be invalid or the report has been deleted.</p>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <Card className="p-8 max-w-md w-full border-none">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <LockIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-center mb-2">Password Protected</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter the password to view this report.
          </p>
          <form onSubmit={handleSubmitPassword} className="space-y-3">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" className="w-full cursor-pointer" disabled={submitting || !password}>
              {submitting ? "Checking..." : "View Report"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-sm text-red-500">{error || "Could not load report"}</p>
      </div>
    );
  }

  const brandColor = report.brand_color || brand?.brand_color || "#3b82f6";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-12">
      {/* Branded header */}
      <div
        className="w-full py-12 px-6"
        style={{
          background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`,
          borderBottom: `3px solid ${brandColor}`,
        }}
      >
        <div className="max-w-3xl mx-auto">
          {brand?.logo_url && (
            <img src={brand.logo_url} alt={brand.company_name} className="h-12 mb-6 object-contain" />
          )}
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {brand?.company_name || "Report"}
          </p>
          <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
          <p className="text-sm text-muted-foreground">
            Prepared for <span className="font-medium text-foreground">{report.client_name}</span> · {report.period}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-4">
        {sections.length === 0 ? (
          <Card className="p-12 text-center border-none">
            <p className="text-sm text-muted-foreground">This report has no content yet.</p>
          </Card>
        ) : (
          sections.map((s) => <SectionRenderer key={s.id} section={s} brandColor={brandColor} />)
        )}
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-6 mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-muted-foreground text-center">
          {brand?.company_name ? `Generated by ${brand.company_name}` : "Generated report"}
        </p>
      </div>
    </div>
  );
}

function SectionRenderer({ section, brandColor }: { section: ReportSection; brandColor: string }) {
  if (section.type === "divider") {
    return <div className="py-2"><div className="h-px bg-neutral-200 dark:bg-neutral-800" /></div>;
  }

  if (section.type === "text") {
    return (
      <Card className="p-6 border-none">
        {section.title && <h2 className="text-lg font-semibold mb-3">{section.title}</h2>}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.text_content || ""}</p>
      </Card>
    );
  }

  if (section.type === "stat") {
    return (
      <Card className="p-6 border-none">
        {section.title && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{section.title}</p>
        )}
        <p className="text-4xl font-bold" style={{ color: brandColor }}>{section.value}</p>
        {section.trend && <p className="text-sm text-muted-foreground mt-2">{section.trend}</p>}
      </Card>
    );
  }

  if (section.type === "image") {
    return (
      <Card className="p-6 border-none">
        {section.title && <h2 className="text-lg font-semibold mb-3">{section.title}</h2>}
        {section.file_url && (
          <img src={section.file_url} alt={section.title} className="w-full rounded-lg" />
        )}
        {section.text_content && (
          <p className="text-xs text-muted-foreground mt-3 text-center italic">{section.text_content}</p>
        )}
      </Card>
    );
  }

  if (section.type === "file") {
    return (
      <Card className="p-6 border-none">
        {section.title && <h2 className="text-lg font-semibold mb-3">{section.title}</h2>}
        {section.file_url && (
          <a href={section.file_url} target="_blank" rel="noopener noreferrer" download>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
              >
                <FileTextIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{section.file_name}</p>
                <p className="text-xs text-muted-foreground">Click to download</p>
              </div>
              <DownloadIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </a>
        )}
      </Card>
    );
  }

  return null;
}
