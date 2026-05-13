"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PlusIcon,
  XIcon,
  FileTextIcon,
  TrashIcon,
  ExternalLinkIcon,
  CopyIcon,
  LockIcon,
  EyeIcon,
  CheckIcon,
  PaletteIcon,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabase } from "@/lib/supabase";

interface Report {
  id: string;
  title: string;
  client_name: string;
  period: string;
  password: string | null;
  published: boolean;
  brand_color: string | null;
  created_at: string;
}

interface BusinessSettings {
  id: string;
  company_name: string;
  brand_color: string;
  logo_url: string | null;
}

export default function ReportsIndex() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [brand, setBrand] = useState<BusinessSettings | null>(null);

  const [newReport, setNewReport] = useState({
    title: "",
    client_name: "",
    period: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    password: "",
  });

  const [brandForm, setBrandForm] = useState({
    company_name: "",
    brand_color: "#3b82f6",
    logo_url: "",
  });

  useEffect(() => {
    fetchReports();
    fetchBrand();
  }, []);

  async function fetchReports() {
    setLoading(true);
    const { data } = await getSupabase()
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  }

  async function fetchBrand() {
    const { data } = await getSupabase()
      .from("business_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      setBrand(data);
      setBrandForm({
        company_name: data.company_name || "",
        brand_color: data.brand_color || "#3b82f6",
        logo_url: data.logo_url || "",
      });
    }
  }

  async function handleCreateReport() {
    const { data } = await getSupabase()
      .from("reports")
      .insert({
        title: newReport.title,
        client_name: newReport.client_name,
        period: newReport.period,
        password: newReport.password || null,
        brand_color: brand?.brand_color || "#3b82f6",
        published: false,
      })
      .select()
      .single();

    if (data) {
      setIsNewOpen(false);
      setNewReport({
        title: "",
        client_name: "",
        period: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        password: "",
      });
      router.push(`/reports/${data.id}`);
    }
  }

  async function handleDelete(id: string) {
    await getSupabase().from("report_sections").delete().eq("report_id", id);
    await getSupabase().from("reports").delete().eq("id", id);
    fetchReports();
  }

  async function handleSaveBrand() {
    const supabase = getSupabase();
    if (brand) {
      await supabase.from("business_settings").update(brandForm).eq("id", brand.id);
    } else {
      await supabase.from("business_settings").insert(brandForm);
    }
    setIsBrandOpen(false);
    fetchBrand();
  }

  function copyShareLink(id: string) {
    const url = `${window.location.origin}/r/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-bold">Reports</h1>
        <div className="ml-4 flex gap-2">
          <Badge variant="outline" className="text-xs">
            {reports.length} Reports
          </Badge>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBrandOpen(true)}
            className="cursor-pointer"
          >
            <PaletteIcon className="w-4 h-4 mr-2" />
            Branding
          </Button>
          <Button size="sm" onClick={() => setIsNewOpen(true)} className="cursor-pointer">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto flex-1 p-8">
        {loading ? (
          <div className="text-center py-20 text-sm text-muted-foreground">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileTextIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No reports yet</p>
            <Button size="sm" onClick={() => setIsNewOpen(true)} className="cursor-pointer">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create your first report
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="border-none p-0 overflow-hidden">
                <div className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${report.brand_color}20`, color: report.brand_color || "#3b82f6" }}
                  >
                    <FileTextIcon className="w-5 h-5" />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/reports/${report.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{report.title}</h3>
                      {report.password && (
                        <LockIcon className="w-3 h-3 text-muted-foreground" />
                      )}
                      {report.published ? (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {report.client_name} · {report.period}
                    </p>
                  </div>
                  {report.published && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => copyShareLink(report.id)}
                    >
                      {copiedId === report.id ? (
                        <>
                          <CheckIcon className="w-3 h-3 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3 h-3 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  )}
                  {report.published && (
                    <Link href={`/r/${report.id}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(report.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New report drawer */}
      <AnimatePresence>
        {isNewOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsNewOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">New Report</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsNewOpen(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Title</label>
                  <Input
                    placeholder="e.g. SEO Performance Report"
                    value={newReport.title}
                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Client Name</label>
                  <Input
                    placeholder="e.g. Acme Co"
                    value={newReport.client_name}
                    onChange={(e) => setNewReport({ ...newReport, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Period</label>
                  <Input
                    placeholder="e.g. January 2026"
                    value={newReport.period}
                    onChange={(e) => setNewReport({ ...newReport, period: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Password (optional)</label>
                  <Input
                    type="text"
                    placeholder="Leave empty for no password"
                    value={newReport.password}
                    onChange={(e) => setNewReport({ ...newReport, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Clients will need this to view the report.
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsNewOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={handleCreateReport}
                  disabled={!newReport.title || !newReport.client_name}
                >
                  Create
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Brand settings drawer */}
      <AnimatePresence>
        {isBrandOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsBrandOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">Branding</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsBrandOpen(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Name</label>
                  <Input
                    placeholder="Your business name"
                    value={brandForm.company_name}
                    onChange={(e) => setBrandForm({ ...brandForm, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Brand Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandForm.brand_color}
                      onChange={(e) => setBrandForm({ ...brandForm, brand_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandForm.brand_color}
                      onChange={(e) => setBrandForm({ ...brandForm, brand_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Logo URL</label>
                  <Input
                    placeholder="https://..."
                    value={brandForm.logo_url}
                    onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste a public URL to your logo. Upload to Supabase Storage first if needed.
                  </p>
                  {brandForm.logo_url && (
                    <div className="mt-3 p-3 border rounded-lg flex items-center gap-3">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <img
                        src={brandForm.logo_url}
                        alt="Logo preview"
                        className="max-h-12 max-w-32 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsBrandOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 cursor-pointer" onClick={handleSaveBrand}>
                  Save
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
