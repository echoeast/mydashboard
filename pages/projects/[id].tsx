"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  PlusIcon,
  XIcon,
  TrashIcon,
  EditIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
  LayoutGridIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CircleIcon,
  GripVerticalIcon,
  RefreshCwIcon,
  TargetIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabase } from "@/lib/supabase";

interface Project {
  id: string;
  name: string;
  description: string;
  type: "client" | "personal";
  status: string;
}

interface Phase {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
}

interface Task {
  id: string;
  project_id: string;
  phase_id: string | null;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  order_index: number;
  google_event_id?: string | null;
  todoist_id?: string | null;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  order_index: number;
}

type ViewMode = "list" | "kanban" | "calendar";

const statusIcons: Record<string, React.ReactNode> = {
  todo: <CircleIcon className="w-4 h-4 text-neutral-400" />,
  in_progress: <CircleDotIcon className="w-4 h-4 text-blue-500" />,
  done: <CheckCircle2Icon className="w-4 h-4 text-green-500" />,
};

const statusBadgeColor: Record<string, string> = {
  todo: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  done: "bg-green-500/10 text-green-600 border-green-500/30",
};

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Drawers
  const [isPhaseDrawerOpen, setIsPhaseDrawerOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultPhaseForTask, setDefaultPhaseForTask] = useState<string | null>(null);

  const [phaseName, setPhaseName] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    phase_id: "" as string | "",
    start_at: "",
    end_at: "",
    duration_minutes: "",
  });

  // Integrations
  const [syncing, setSyncing] = useState<"google" | "todoist" | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    fetchAll(id);
  }, [id]);

  async function fetchAll(projectId: string) {
    setLoading(true);
    const supabase = getSupabase();
    const [projRes, phaseRes, taskRes, msRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("phases").select("*").eq("project_id", projectId).order("order_index"),
      supabase.from("tasks").select("*").eq("project_id", projectId).order("order_index"),
      supabase.from("milestones").select("*").eq("project_id", projectId).order("order_index"),
    ]);

    if (projRes.data) setProject(projRes.data);
    setPhases(phaseRes.data || []);
    setTasks(taskRes.data || []);
    setMilestones(msRes.data || []);
    setLoading(false);
  }

  // Phase handlers
  async function handleSavePhase() {
    if (!project || !phaseName.trim()) return;
    const supabase = getSupabase();
    if (editingPhase) {
      await supabase.from("phases").update({ name: phaseName }).eq("id", editingPhase.id);
    } else {
      await supabase.from("phases").insert({
        project_id: project.id,
        name: phaseName,
        order_index: phases.length,
      });
    }
    setPhaseName("");
    setEditingPhase(null);
    setIsPhaseDrawerOpen(false);
    fetchAll(project.id);
  }

  async function handleDeletePhase(phaseId: string) {
    if (!project) return;
    const supabase = getSupabase();
    await supabase.from("tasks").update({ phase_id: null }).eq("phase_id", phaseId);
    await supabase.from("phases").delete().eq("id", phaseId);
    fetchAll(project.id);
  }

  function openEditPhase(phase: Phase) {
    setEditingPhase(phase);
    setPhaseName(phase.name);
    setIsPhaseDrawerOpen(true);
  }

  function openNewPhase() {
    setEditingPhase(null);
    setPhaseName("");
    setIsPhaseDrawerOpen(true);
  }

  // Task handlers
  function openNewTask(phaseId: string | null = null) {
    setEditingTask(null);
    setDefaultPhaseForTask(phaseId);
    setTaskForm({
      title: "",
      description: "",
      status: "todo",
      phase_id: phaseId || "",
      start_at: "",
      end_at: "",
      duration_minutes: "",
    });
    setIsTaskDrawerOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      phase_id: task.phase_id || "",
      start_at: task.start_at ? toLocalInputValue(task.start_at) : "",
      end_at: task.end_at ? toLocalInputValue(task.end_at) : "",
      duration_minutes: task.duration_minutes ? String(task.duration_minutes) : "",
    });
    setIsTaskDrawerOpen(true);
  }

  function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function handleSaveTask() {
    if (!project || !taskForm.title.trim()) return;
    const supabase = getSupabase();

    const data: any = {
      title: taskForm.title,
      description: taskForm.description,
      status: taskForm.status,
      phase_id: taskForm.phase_id || null,
      start_at: taskForm.start_at ? new Date(taskForm.start_at).toISOString() : null,
      end_at: taskForm.end_at ? new Date(taskForm.end_at).toISOString() : null,
      duration_minutes: taskForm.duration_minutes ? parseInt(taskForm.duration_minutes) : null,
    };

    if (editingTask) {
      await supabase.from("tasks").update(data).eq("id", editingTask.id);
    } else {
      await supabase.from("tasks").insert({
        ...data,
        project_id: project.id,
        order_index: tasks.length,
      });
    }
    setIsTaskDrawerOpen(false);
    setEditingTask(null);
    fetchAll(project.id);
  }

  async function handleDeleteTask(taskId: string) {
    if (!project) return;
    await getSupabase().from("tasks").delete().eq("id", taskId);
    fetchAll(project.id);
  }

  async function cycleTaskStatus(task: Task) {
    if (!project) return;
    const next: Record<Task["status"], Task["status"]> = {
      todo: "in_progress",
      in_progress: "done",
      done: "todo",
    };
    await getSupabase().from("tasks").update({ status: next[task.status] }).eq("id", task.id);
    fetchAll(project.id);
  }

  async function cycleMilestoneStatus(m: Milestone) {
    if (!project) return;
    const next: Record<Milestone["status"], Milestone["status"]> = {
      pending: "in_progress",
      in_progress: "completed",
      completed: "pending",
    };
    await getSupabase().from("milestones").update({ status: next[m.status] }).eq("id", m.id);
    fetchAll(project.id);
  }

  async function setTaskStatus(taskId: string, status: Task["status"]) {
    if (!project) return;
    await getSupabase().from("tasks").update({ status }).eq("id", taskId);
    fetchAll(project.id);
  }

  // Integrations
  async function syncToGoogle() {
    if (!project) return;
    setSyncing("google");
    setSyncMessage(null);
    try {
      const res = await fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncMessage(`Synced ${data.synced} tasks to Google Calendar`);
      fetchAll(project.id);
    } catch (err: any) {
      if (err.message === "not_connected") {
        window.location.href = "/api/google/auth";
        return;
      }
      setSyncMessage(`Google sync error: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  }

  async function syncToTodoist() {
    if (!project) return;
    setSyncing("todoist");
    setSyncMessage(null);
    try {
      const res = await fetch("/api/todoist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncMessage(`Synced ${data.synced} tasks to Todoist`);
      fetchAll(project.id);
    } catch (err: any) {
      setSyncMessage(`Todoist sync error: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  }

  // Computed
  const tasksByPhase = useMemo(() => {
    const map: Record<string, Task[]> = { _unassigned: [] };
    phases.forEach((p) => (map[p.id] = []));
    tasks.forEach((t) => {
      const key = t.phase_id || "_unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [phases, tasks]);

  const tasksByStatus = useMemo(() => {
    const map: Record<Task["status"], Task[]> = { todo: [], in_progress: [], done: [] };
    tasks.forEach((t) => map[t.status].push(t));
    return map;
  }, [tasks]);

  const progress = useMemo(() => {
    if (tasks.length === 0 && milestones.length === 0) return 0;
    const total = tasks.length + milestones.length;
    const done =
      tasks.filter((t) => t.status === "done").length +
      milestones.filter((m) => m.status === "completed").length;
    return Math.round((done / total) * 100);
  }, [tasks, milestones]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground text-sm">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-3">
        <p className="text-muted-foreground text-sm">Project not found</p>
        <Link href="/projects">
          <Button variant="outline" size="sm">Back to projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/projects">
          <Button variant="ghost" size="icon" className="mr-2 cursor-pointer">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold">{project.name}</h1>
          <p className="text-xs text-muted-foreground">{project.description || "No description"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Progress value={progress} className="h-2 w-24" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>

          <div className="flex gap-1 bg-secondary p-1 rounded-lg">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setView("list")}
            >
              <ListIcon className="w-3 h-3 mr-1" />
              List
            </Button>
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setView("kanban")}
            >
              <LayoutGridIcon className="w-3 h-3 mr-1" />
              Kanban
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setView("calendar")}
            >
              <CalendarIcon className="w-3 h-3 mr-1" />
              Calendar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto flex-1 p-8">
        {/* Sync bar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={syncToGoogle}
            disabled={syncing === "google"}
            className="cursor-pointer"
          >
            <RefreshCwIcon className={`w-3 h-3 mr-2 ${syncing === "google" ? "animate-spin" : ""}`} />
            Sync to Google Calendar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={syncToTodoist}
            disabled={syncing === "todoist"}
            className="cursor-pointer"
          >
            <RefreshCwIcon className={`w-3 h-3 mr-2 ${syncing === "todoist" ? "animate-spin" : ""}`} />
            Sync to Todoist
          </Button>
          <Button variant="outline" size="sm" onClick={openNewPhase} className="cursor-pointer">
            <PlusIcon className="w-3 h-3 mr-2" />
            New Phase
          </Button>
          <Button size="sm" onClick={() => openNewTask(null)} className="cursor-pointer">
            <PlusIcon className="w-3 h-3 mr-2" />
            New Task
          </Button>
          {syncMessage && (
            <Badge variant="outline" className="text-xs ml-2">{syncMessage}</Badge>
          )}
        </div>

        {/* Milestones bar */}
        {milestones.length > 0 && (
          <Card className="p-4 mb-4 border-none">
            <div className="flex items-center gap-2 mb-3">
              <TargetIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Milestones</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {milestones.map((m) => (
                <button
                  key={m.id}
                  onClick={() => cycleMilestoneStatus(m)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${
                    m.status === "completed"
                      ? "bg-green-500/10 text-green-600 border-green-500/30 line-through"
                      : m.status === "in_progress"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                      : "bg-neutral-500/10 text-neutral-600 border-neutral-500/30"
                  }`}
                >
                  {m.status === "completed" ? <CheckCircle2Icon className="w-3 h-3" /> :
                   m.status === "in_progress" ? <CircleDotIcon className="w-3 h-3" /> :
                   <CircleIcon className="w-3 h-3" />}
                  {m.title}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Views */}
        {view === "list" && (
          <ListView
            phases={phases}
            tasksByPhase={tasksByPhase}
            onAddTask={openNewTask}
            onEditTask={openEditTask}
            onDeleteTask={handleDeleteTask}
            onCycleTask={cycleTaskStatus}
            onEditPhase={openEditPhase}
            onDeletePhase={handleDeletePhase}
          />
        )}

        {view === "kanban" && (
          <KanbanView
            tasksByStatus={tasksByStatus}
            phases={phases}
            onSetStatus={setTaskStatus}
            onEditTask={openEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {view === "calendar" && (
          <CalendarView
            tasks={tasks}
            currentDate={calendarDate}
            setCurrentDate={setCalendarDate}
            onClickTask={openEditTask}
          />
        )}
      </div>

      {/* Phase drawer */}
      <AnimatePresence>
        {isPhaseDrawerOpen && (
          <Drawer onClose={() => setIsPhaseDrawerOpen(false)}>
            <DrawerHeader title={editingPhase ? "Edit Phase" : "New Phase"} onClose={() => setIsPhaseDrawerOpen(false)} />
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Phase Name</label>
                <Input
                  placeholder="e.g. Design, Development, Testing"
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                />
              </div>
            </div>
            <DrawerFooter
              onCancel={() => setIsPhaseDrawerOpen(false)}
              onSave={handleSavePhase}
              saveLabel={editingPhase ? "Save" : "Create Phase"}
              saveDisabled={!phaseName.trim()}
            />
          </Drawer>
        )}
      </AnimatePresence>

      {/* Task drawer */}
      <AnimatePresence>
        {isTaskDrawerOpen && (
          <Drawer onClose={() => setIsTaskDrawerOpen(false)}>
            <DrawerHeader title={editingTask ? "Edit Task" : "New Task"} onClose={() => setIsTaskDrawerOpen(false)} />
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="What needs to be done?"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Optional details"
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phase</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
                  value={taskForm.phase_id}
                  onChange={(e) => setTaskForm({ ...taskForm, phase_id: e.target.value })}
                >
                  <option value="">No phase</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["todo", "in_progress", "done"] as const).map((s) => (
                    <Button
                      key={s}
                      variant={taskForm.status === s ? "default" : "outline"}
                      size="sm"
                      className="cursor-pointer capitalize"
                      onClick={() => setTaskForm({ ...taskForm, status: s })}
                    >
                      {s.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start</label>
                  <Input
                    type="datetime-local"
                    value={taskForm.start_at}
                    onChange={(e) => setTaskForm({ ...taskForm, start_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End</label>
                  <Input
                    type="datetime-local"
                    value={taskForm.end_at}
                    onChange={(e) => setTaskForm({ ...taskForm, end_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="e.g. 60"
                  value={taskForm.duration_minutes}
                  onChange={(e) => setTaskForm({ ...taskForm, duration_minutes: e.target.value })}
                />
              </div>
              {editingTask && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 cursor-pointer"
                    onClick={() => {
                      handleDeleteTask(editingTask.id);
                      setIsTaskDrawerOpen(false);
                    }}
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete task
                  </Button>
                </div>
              )}
            </div>
            <DrawerFooter
              onCancel={() => setIsTaskDrawerOpen(false)}
              onSave={handleSaveTask}
              saveLabel={editingTask ? "Save" : "Create Task"}
              saveDisabled={!taskForm.title.trim()}
            />
          </Drawer>
        )}
      </AnimatePresence>
    </>
  );
}

// --- View components ---

function ListView({
  phases,
  tasksByPhase,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onCycleTask,
  onEditPhase,
  onDeletePhase,
}: {
  phases: Phase[];
  tasksByPhase: Record<string, Task[]>;
  onAddTask: (phaseId: string | null) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onCycleTask: (task: Task) => void;
  onEditPhase: (phase: Phase) => void;
  onDeletePhase: (id: string) => void;
}) {
  const allColumns: Array<{ id: string; name: string; isPhase: boolean }> = [
    ...phases.map((p) => ({ id: p.id, name: p.name, isPhase: true })),
  ];
  if ((tasksByPhase._unassigned || []).length > 0) {
    allColumns.push({ id: "_unassigned", name: "Unassigned", isPhase: false });
  }

  if (allColumns.length === 0) {
    return (
      <Card className="p-12 text-center border-none">
        <p className="text-sm text-muted-foreground mb-4">No phases yet. Create one to organize tasks.</p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-min">
        {allColumns.map((col) => (
          <div key={col.id} className="w-80 flex-shrink-0">
            <Card className="border-none p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                <GripVerticalIcon className="w-3 h-3 text-muted-foreground" />
                <h3 className="text-sm font-semibold flex-1">{col.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {(tasksByPhase[col.id] || []).length}
                </Badge>
                {col.isPhase && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      onClick={() => onEditPhase(phases.find((p) => p.id === col.id)!)}
                    >
                      <EditIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer text-red-500 hover:text-red-600"
                      onClick={() => onDeletePhase(col.id)}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1 min-h-32">
                {(tasksByPhase[col.id] || []).map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onCycle={onCycleTask}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground cursor-pointer"
                  onClick={() => onAddTask(col.isPhase ? col.id : null)}
                >
                  <PlusIcon className="w-3 h-3 mr-2" />
                  Add Task
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanView({
  tasksByStatus,
  phases,
  onSetStatus,
  onEditTask,
  onDeleteTask,
}: {
  tasksByStatus: Record<Task["status"], Task[]>;
  phases: Phase[];
  onSetStatus: (id: string, status: Task["status"]) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}) {
  const columns: Array<{ key: Task["status"]; title: string; color: string }> = [
    { key: "todo", title: "To Do", color: "border-neutral-500/30" },
    { key: "in_progress", title: "In Progress", color: "border-blue-500/30" },
    { key: "done", title: "Done", color: "border-green-500/30" },
  ];

  function getPhaseName(phaseId: string | null) {
    if (!phaseId) return null;
    return phases.find((p) => p.id === phaseId)?.name;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => (
        <Card key={col.key} className={`border-none p-0 overflow-hidden`}>
          <div className={`px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              {statusIcons[col.key]}
              <h3 className="text-sm font-semibold">{col.title}</h3>
            </div>
            <Badge variant="outline" className="text-xs">{tasksByStatus[col.key].length}</Badge>
          </div>
          <div className="p-2 space-y-2 min-h-64">
            {tasksByStatus[col.key].map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-background hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors"
                onClick={() => onEditTask(t)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium flex-1">{t.title}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-1 cursor-pointer text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(t.id);
                    }}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {getPhaseName(t.phase_id) && (
                    <Badge variant="outline" className="text-xs">{getPhaseName(t.phase_id)}</Badge>
                  )}
                  {t.start_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(t.start_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-2">
                  {columns.filter((c) => c.key !== col.key).map((c) => (
                    <Button
                      key={c.key}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetStatus(t.id, c.key);
                      }}
                    >
                      → {c.title}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {tasksByStatus[col.key].length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function CalendarView({
  tasks,
  currentDate,
  setCurrentDate,
  onClickTask,
}: {
  tasks: Task[];
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  onClickTask: (t: Task) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = lastDay.getDate();

  const weeks: Array<Array<Date | null>> = [];
  let week: Array<Date | null> = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  function tasksForDate(d: Date): Task[] {
    const dayStr = d.toDateString();
    return tasks.filter((t) => {
      if (!t.start_at) return false;
      return new Date(t.start_at).toDateString() === dayStr;
    });
  }

  const monthName = currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const today = new Date().toDateString();

  return (
    <Card className="border-none p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-sm font-semibold">{monthName}</h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const dayTasks = day ? tasksForDate(day) : [];
            const isToday = day?.toDateString() === today;
            return (
              <div
                key={`${wi}-${di}`}
                className={`min-h-24 p-2 border-r border-b border-neutral-200 dark:border-neutral-800 ${
                  !day ? "bg-neutral-50/50 dark:bg-neutral-900/30" : ""
                }`}
              >
                {day && (
                  <>
                    <div className={`text-xs mb-1 ${isToday ? "font-bold text-blue-600" : "text-muted-foreground"}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onClickTask(t)}
                          className={`block w-full text-left text-xs px-1.5 py-1 rounded truncate cursor-pointer border ${statusBadgeColor[t.status]}`}
                        >
                          {t.title}
                        </button>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{dayTasks.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function TaskCard({
  task,
  onCycle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onCycle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
      <button onClick={() => onCycle(task)} className="flex-shrink-0 cursor-pointer">
        {statusIcons[task.status]}
      </button>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onEdit(task)}
      >
        <p className={`text-sm truncate ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        {(task.start_at || task.duration_minutes) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {task.start_at && (
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {new Date(task.start_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {" "}
                {new Date(task.start_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {task.duration_minutes && <span>· {task.duration_minutes}min</span>}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 cursor-pointer text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(task.id)}
      >
        <TrashIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}

// --- Drawer primitives ---
function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
      >
        {children}
      </motion.div>
    </>
  );
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <XIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

function DrawerFooter({
  onCancel,
  onSave,
  saveLabel,
  saveDisabled,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
  saveDisabled?: boolean;
}) {
  return (
    <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
      <Button variant="outline" className="flex-1 cursor-pointer" onClick={onCancel}>
        Cancel
      </Button>
      <Button className="flex-1 cursor-pointer" onClick={onSave} disabled={saveDisabled}>
        {saveLabel}
      </Button>
    </div>
  );
}
