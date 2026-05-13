"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  EyeIcon,
  EditIcon,
  UploadIcon,
  TypeIcon,
  BarChart3Icon,
  ImageIcon,
  PaperclipIcon,
  MinusIcon,
  LockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SaveIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
}

type SectionType = "text" | "stat" | "image" | "file" | "divider";

interface ReportSection {
  id: string;
  report_id: string;
  type: SectionType;
  title: string;
  text_content: string | null;
  value: string | null;
  trend: string | null;
  file_url: string | null;
  file_name: string | null;
  order_index: number;
}

const sectionTypeMeta: Record<SectionType, { label: string; icon: React.ReactNode }> = {
  text: { label: "Text Block", icon: <TypeIcon className="w-4 h-4" /> },
  stat: { label: "Stat", icon: <BarChart3Icon className="w-4 h-4" /> },
  image: { label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
  file: { label: "File Attachment", icon: <PaperclipIcon className="w-4 h-4" /> },
  divider: { label: "Divider", icon: <MinusIcon className="w-4 h-4" /> },
};

export default function ReportEditor() {
  const router = useRouter();
  const { id } = router.query;

  const [report, setReport] = useState<Report | null>(null);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingSection, setEditingSection] = useState<ReportSection | null>(null);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [sectionForm, setSectionForm] = useState({
    type: "text" as SectionType,
    title: "",
    text_content: "",
    value: "",
    trend: "",
    file_url: "",
    file_name: "",
  });

  const [reportForm, setReportForm] = useState({
    title: "",
    client_name: "",
    period: "",
    password: "",
    published: false,
    brand_color: "#3b82f6",
  });

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    fetchAll(id);
  }, [id]);

  async function fetchAll(reportId: string) {
    setLoading(true);
    const supabase = getSupabase();
    const [reportRes, sectionsRes] = await Promise.all([
      supabase.from("reports").select("*").eq("id", reportId).single(),
      supabase.from("report_sections").select("*").eq("report_id", reportId).order("order_index"),
    ]);

    if (reportRes.data) {
      setReport(reportRes.data);
      setReportForm({
        title: reportRes.data.title,
        client_name: reportRes.data.client_name,
        period: reportRes.data.period,
        password: reportRes.data.password || "",
        published: reportRes.data.published,
        brand_color: reportRes.data.brand_color || "#3b82f6",
      });
    }
    setSections(sectionsRes.data || []);
    setLoading(false);
  }

  function openNewSection(type: SectionType) {
    setEditingSection(null);
    setSectionForm({
      type,
      title: "",
      text_content: "",
      value: "",
      trend: "",
      file_url: "",
      file_name: "",
    });
    setIsSectionOpen(true);
  }

  function openEditSection(s: ReportSection) {
    setEditingSection(s);
    setSectionForm({
      type: s.type,
      title: s.title || "",
      text_content: s.text_content || "",
      value: s.value || "",
      trend: s.trend || "",
      file_url: s.file_url || "",
      file_name: s.file_name || "",
    });
    setIsSectionOpen(true);
  }

  async function handleFileUpload(file: File) {
    if (!report) return;
    setUploading(true);
    try {
      const supabase = getSupabase();
      const path = `${report.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("reports").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("reports").getPublicUrl(path);
      setSectionForm({
        ...sectionForm,
        file_url: urlData.publicUrl,
        file_name: file.name,
      });
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveSection() {
    if (!report) return;
    const supabase = getSupabase();

    const data = {
      type: sectionForm.type,
      title: sectionForm.title,
      text_content: sectionForm.text_content || null,
      value: sectionForm.value || null,
      trend: sectionForm.trend || null,
      file_url: sectionForm.file_url || null,
      file_name: sectionForm.file_name || null,
    };

    if (editingSection) {
      await supabase.from("report_sections").update(data).eq("id", editingSection.id);
    } else {
      await supabase.from("report_sections").insert({
        ...data,
        report_id: report.id,
        order_index: sections.length,
      });
    }
    setIsSectionOpen(false);
    setEditingSection(null);
    fetchAll(report.id);
  }

  async function handleDeleteSection(sectionId: string) {
    if (!report) return;
    await getSupabase().from("report_sections").delete().eq("id", sectionId);
    fetchAll(report.id);
  }

  async function moveSection(s: ReportSection, direction: -1 | 1) {
    if (!report) return;
    const idx = sections.findIndex((x) => x.id === s.id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const other = sections[newIdx];
    const supabase = getSupabase();
    await supabase.from("report_sections").update({ order_index: other.order_index }).eq("id", s.id);
    await supabase.from("report_sections").update({ order_index: s.order_index }).eq("id", other.id);
    fetchAll(report.id);
  }

  async function handleSaveReport() {
    if (!report) return;
    setSaving(true);
    await getSupabase()
      .from("reports")
      .update({
        title: reportForm.title,
        client_name: reportForm.client_name,
        period: reportForm.period,
        password: reportForm.password || null,
        published: reportForm.published,
        brand_color: reportForm.brand_color,
      })
      .eq("id", report.id);
    setSaving(false);
    setIsSettingsOpen(false);
    fetchAll(report.id);
  }

  function copyShareLink() {
    if (!report) return;
    const url = `${window.location.origin}/r/${report.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Loading...</div>;
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-sm text-muted-foreground">Report not found</p>
        <Link href="/reports">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/reports">
          <Button variant="ghost" size="icon" className="mr-2 cursor-pointer">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{report.title}</h1>
            {report.published ? (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                Published
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Draft</Badge>
            )}
            {report.password && <LockIcon className="w-3 h-3 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {report.client_name} · {report.period}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {report.published && (
            <Button variant="outline" size="sm" onClick={copyShareLink} className="cursor-pointer">
              {copied ? (
                <><CheckIcon className="w-3 h-3 mr-2" />Copied</>
              ) : (
                <><CopyIcon className="w-3 h-3 mr-2" />Share Link</>
              )}
            </Button>
          )}
          {report.published && (
            <Link href={`/r/${report.id}`} target="_blank">
              <Button variant="outline" size="sm" className="cursor-pointer">
                <EyeIcon className="w-3 h-3 mr-2" />
                Preview
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
            <EditIcon className="w-3 h-3 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto flex-1 p-8 space-y-4">
        {/* Add section toolbar */}
        <Card className="p-3 border-none">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-2">Add section:</span>
            {(Object.keys(sectionTypeMeta) as SectionType[]).map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => openNewSection(type)}
                className="cursor-pointer"
              >
                {sectionTypeMeta[type].icon}
                <span className="ml-2">{sectionTypeMeta[type].label}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Sections */}
        {sections.length === 0 ? (
          <Card className="p-12 text-center border-none">
            <p className="text-sm text-muted-foreground">
              No sections yet. Add a text block, stat, image, or file above.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sections.map((s, i) => (
              <Card key={s.id} className="border-none p-0 overflow-hidden group">
                <div className="flex items-start gap-3 p-4">
                  <div className="flex flex-col gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      disabled={i === 0}
                      onClick={() => moveSection(s, -1)}
                    >
                      <ArrowUpIcon className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      disabled={i === sections.length - 1}
                      onClick={() => moveSection(s, 1)}
                    >
                      <ArrowDownIcon className="w-3 h-3" />
                    </Button>
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => openEditSection(s)}
                  >
                    <SectionPreview section={s} brandColor={report.brand_color || "#3b82f6"} />
                  </div>

                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => openEditSection(s)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteSection(s.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section drawer */}
      <AnimatePresence>
        {isSectionOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsSectionOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">
                  {editingSection ? "Edit" : "Add"} {sectionTypeMeta[sectionForm.type].label}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsSectionOpen(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {sectionForm.type !== "divider" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Section Title</label>
                    <Input
                      placeholder="e.g. Organic Traffic Overview"
                      value={sectionForm.title}
                      onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    />
                  </div>
                )}

                {sectionForm.type === "text" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content</label>
                    <Textarea
                      rows={8}
                      placeholder="Write your commentary, analysis, or notes..."
                      value={sectionForm.text_content}
                      onChange={(e) => setSectionForm({ ...sectionForm, text_content: e.target.value })}
                    />
                  </div>
                )}

                {sectionForm.type === "stat" && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Value</label>
                      <Input
                        placeholder="e.g. 12,345 or £2,400"
                        value={sectionForm.value}
                        onChange={(e) => setSectionForm({ ...sectionForm, value: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Trend / Subtitle (optional)</label>
                      <Input
                        placeholder="e.g. +23% vs last month"
                        value={sectionForm.trend}
                        onChange={(e) => setSectionForm({ ...sectionForm, trend: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {(sectionForm.type === "image" || sectionForm.type === "file") && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {sectionForm.type === "image" ? "Upload Image" : "Upload File"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept={sectionForm.type === "image" ? "image/*" : undefined}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f);
                        }}
                        className="hidden"
                        id="section-file"
                      />
                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => document.getElementById("section-file")?.click()}
                        disabled={uploading}
                      >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Choose File"}
                      </Button>
                      {sectionForm.file_name && (
                        <span className="text-xs text-muted-foreground self-center truncate">
                          {sectionForm.file_name}
                        </span>
                      )}
                    </div>
                    {sectionForm.file_url && sectionForm.type === "image" && (
                      <div className="mt-3 p-3 border rounded-lg">
                        <img src={sectionForm.file_url} alt="Preview" className="max-h-48 mx-auto object-contain" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Requires Supabase Storage bucket named "reports". See setup.
                    </p>
                    {sectionForm.type === "image" && (
                      <div className="mt-4">
                        <label className="text-sm font-medium mb-2 block">Caption (optional)</label>
                        <Input
                          placeholder="Caption shown under the image"
                          value={sectionForm.text_content}
                          onChange={(e) => setSectionForm({ ...sectionForm, text_content: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsSectionOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 cursor-pointer" onClick={handleSaveSection}>
                  Save
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">Report Settings</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Client</label>
                  <Input
                    value={reportForm.client_name}
                    onChange={(e) => setReportForm({ ...reportForm, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Period</label>
                  <Input
                    value={reportForm.period}
                    onChange={(e) => setReportForm({ ...reportForm, period: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <Input
                    type="text"
                    placeholder="Leave empty for no password"
                    value={reportForm.password}
                    onChange={(e) => setReportForm({ ...reportForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Brand Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={reportForm.brand_color}
                      onChange={(e) => setReportForm({ ...reportForm, brand_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={reportForm.brand_color}
                      onChange={(e) => setReportForm({ ...reportForm, brand_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Published</p>
                    <p className="text-xs text-muted-foreground">Make this report viewable via share link</p>
                  </div>
                  <Button
                    variant={reportForm.published ? "default" : "outline"}
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setReportForm({ ...reportForm, published: !reportForm.published })}
                  >
                    {reportForm.published ? "Published" : "Draft"}
                  </Button>
                </div>
              </div>
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 cursor-pointer" onClick={handleSaveReport} disabled={saving}>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SectionPreview({ section, brandColor }: { section: ReportSection; brandColor: string }) {
  if (section.type === "divider") {
    return <div className="py-2"><div className="h-px bg-neutral-200 dark:bg-neutral-800" /></div>;
  }
  if (section.type === "text") {
    return (
      <div>
        {section.title && <h3 className="text-sm font-semibold mb-1">{section.title}</h3>}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
          {section.text_content || "(empty)"}
        </p>
      </div>
    );
  }
  if (section.type === "stat") {
    return (
      <div>
        {section.title && <p className="text-xs uppercase text-muted-foreground mb-1">{section.title}</p>}
        <p className="text-2xl font-bold" style={{ color: brandColor }}>{section.value || "—"}</p>
        {section.trend && <p className="text-xs text-muted-foreground mt-1">{section.trend}</p>}
      </div>
    );
  }
  if (section.type === "image") {
    return (
      <div>
        {section.title && <p className="text-sm font-semibold mb-2">{section.title}</p>}
        {section.file_url ? (
          <img src={section.file_url} alt={section.title} className="max-h-32 rounded-md" />
        ) : (
          <p className="text-xs text-muted-foreground">(no image uploaded)</p>
        )}
        {section.text_content && <p className="text-xs text-muted-foreground mt-1">{section.text_content}</p>}
      </div>
    );
  }
  if (section.type === "file") {
    return (
      <div className="flex items-center gap-3">
        <PaperclipIcon className="w-4 h-4 text-muted-foreground" />
        <div>
          {section.title && <p className="text-sm font-medium">{section.title}</p>}
          <p className="text-xs text-muted-foreground">{section.file_name || "(no file)"}</p>
        </div>
      </div>
    );
  }
  return null;
}
