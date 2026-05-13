"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  PlusIcon,
  XIcon,
  TrashIcon,
  EditIcon,
  FolderKanbanIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabase } from "@/lib/supabase";

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  order_index: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  type: "client" | "personal";
  status: "not_started" | "in_progress" | "launched" | "on_hold";
  created_at: string;
  milestones: Milestone[];
}

const statusColors: Record<string, string> = {
  not_started: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  launched: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  on_hold: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  launched: "Launched",
  on_hold: "On Hold",
};

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    type: "personal" as "client" | "personal",
    status: "not_started" as Project["status"],
  });
  const [milestoneInputs, setMilestoneInputs] = useState<string[]>([""]);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data: projectsData } = await getSupabase()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: milestonesData } = await getSupabase()
      .from("milestones")
      .select("*")
      .order("order_index", { ascending: true });

    const projectsWithMilestones = (projectsData || []).map((p: any) => ({
      ...p,
      milestones: (milestonesData || []).filter((m: any) => m.project_id === p.id),
    }));

    setProjects(projectsWithMilestones);
    setLoading(false);
  }

  function getProgress(milestones: Milestone[]) {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.status === "completed").length;
    return Math.round((completed / milestones.length) * 100);
  }

  async function handleAddProject() {
    const { data: project, error } = await getSupabase()
      .from("projects")
      .insert({
        name: newProject.name,
        description: newProject.description,
        type: newProject.type,
        status: newProject.status,
      })
      .select()
      .single();

    if (error) return;

    const validMilestones = milestoneInputs.filter((m) => m.trim());
    if (validMilestones.length > 0) {
      await getSupabase().from("milestones").insert(
        validMilestones.map((title, i) => ({
          project_id: project.id,
          title,
          status: "pending",
          order_index: i,
        }))
      );
    }

    setIsDrawerOpen(false);
    setNewProject({ name: "", description: "", type: "personal", status: "not_started" });
    setMilestoneInputs([""]);
    fetchProjects();
  }

  async function handleUpdateProject() {
    if (!editingProject) return;

    await getSupabase()
      .from("projects")
      .update({
        name: newProject.name,
        description: newProject.description,
        type: newProject.type,
        status: newProject.status,
      })
      .eq("id", editingProject.id);

    await getSupabase().from("milestones").delete().eq("project_id", editingProject.id);

    const validMilestones = milestoneInputs.filter((m) => m.trim());
    if (validMilestones.length > 0) {
      await getSupabase().from("milestones").insert(
        validMilestones.map((title, i) => ({
          project_id: editingProject.id,
          title,
          status: editingProject.milestones.find((m) => m.title === title)?.status || "pending",
          order_index: i,
        }))
      );
    }

    setIsDrawerOpen(false);
    setEditingProject(null);
    setNewProject({ name: "", description: "", type: "personal", status: "not_started" });
    setMilestoneInputs([""]);
    fetchProjects();
  }

  async function handleDeleteProject(id: string) {
    await getSupabase().from("tasks").delete().eq("project_id", id);
    await getSupabase().from("phases").delete().eq("project_id", id);
    await getSupabase().from("milestones").delete().eq("project_id", id);
    await getSupabase().from("projects").delete().eq("id", id);
    fetchProjects();
  }

  function openEditDrawer(project: Project) {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
    });
    setMilestoneInputs(
      project.milestones.length > 0 ? project.milestones.map((m) => m.title) : [""]
    );
    setIsDrawerOpen(true);
  }

  function openNewDrawer() {
    setEditingProject(null);
    setNewProject({ name: "", description: "", type: "personal", status: "not_started" });
    setMilestoneInputs([""]);
    setIsDrawerOpen(true);
  }

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-bold">Projects</h1>
        <div className="ml-4 flex gap-2">
          <Badge variant="outline" className="text-xs">
            {projects.length} Projects
          </Badge>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={openNewDrawer} className="cursor-pointer">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground text-sm">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderKanbanIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm mb-4">No projects yet</p>
            <Button size="sm" onClick={openNewDrawer} className="cursor-pointer">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const progress = getProgress(project.milestones);

              return (
                <Card key={project.id} className="border-none p-0 overflow-hidden group">
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                        <Badge variant="outline" className={`text-xs ${statusColors[project.status]}`}>
                          {statusLabels[project.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.type}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-2 w-32">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDrawer(project);
                          }}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                        <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingProject(null);
              }}
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
                  {editingProject ? "Edit Project" : "New Project"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setEditingProject(null);
                  }}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Name</label>
                    <Input
                      placeholder="My awesome project"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="What's this project about?"
                      rows={3}
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <div className="flex gap-2">
                      {(["personal", "client"] as const).map((type) => (
                        <Button
                          key={type}
                          variant={newProject.type === type ? "default" : "outline"}
                          size="sm"
                          className="flex-1 cursor-pointer capitalize"
                          onClick={() => setNewProject({ ...newProject, type })}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["not_started", "in_progress", "launched", "on_hold"] as const).map((status) => (
                        <Button
                          key={status}
                          variant={newProject.status === status ? "default" : "outline"}
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => setNewProject({ ...newProject, status })}
                        >
                          {statusLabels[status]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Milestones</label>
                    <p className="text-xs text-muted-foreground mb-2">Key goals for this project. Add phases and detailed tasks on the project page.</p>
                    <div className="space-y-2">
                      {milestoneInputs.map((ms, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            placeholder={`Milestone ${i + 1}`}
                            value={ms}
                            onChange={(e) => {
                              const updated = [...milestoneInputs];
                              updated[i] = e.target.value;
                              setMilestoneInputs(updated);
                            }}
                          />
                          {milestoneInputs.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0 cursor-pointer"
                              onClick={() =>
                                setMilestoneInputs(milestoneInputs.filter((_, idx) => idx !== i))
                              }
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full cursor-pointer"
                        onClick={() => setMilestoneInputs([...milestoneInputs, ""])}
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Milestone
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setEditingProject(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={editingProject ? handleUpdateProject : handleAddProject}
                  disabled={!newProject.name}
                >
                  {editingProject ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
