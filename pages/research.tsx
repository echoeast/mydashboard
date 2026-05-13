"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  SearchIcon,
  RefreshCwIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase";

interface Subreddit {
  id: string;
  name: string;
  url: string;
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
}

interface ScrapeResults {
  [sub: string]: { posts: RedditPost[]; error?: string };
}

export default function Research() {
  const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
  const [input, setInput] = useState("");
  const [monthsBack, setMonthsBack] = useState(3);
  const [scraping, setScraping] = useState(false);
  const [results, setResults] = useState<ScrapeResults | null>(null);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchSubreddits();
  }, []);

  async function fetchSubreddits() {
    const { data } = await getSupabase()
      .from("subreddits")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSubreddits(data);
  }

  function normalizeInput(raw: string): { name: string; url: string } | null {
    const trimmed = raw.trim().replace(/\/$/, "");
    if (!trimmed) return null;
    const match = trimmed.match(/(?:^|\/)r\/([a-zA-Z0-9_]+)/i);
    const name = match ? match[1] : trimmed.replace(/^r\//, "");
    if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) return null;
    return { name, url: `https://www.reddit.com/r/${name}` };
  }

  async function handleAdd() {
    const parsed = normalizeInput(input);
    if (!parsed) return;
    if (subreddits.find((s) => s.name.toLowerCase() === parsed.name.toLowerCase())) {
      setInput("");
      return;
    }
    await getSupabase().from("subreddits").insert(parsed);
    setInput("");
    fetchSubreddits();
  }

  async function handleRemove(id: string) {
    await getSupabase().from("subreddits").delete().eq("id", id);
    fetchSubreddits();
  }

  async function handleScrape() {
    if (subreddits.length === 0) return;
    setScraping(true);
    setResults(null);
    setOutput("");
    setProgress("Fetching posts from Reddit...");

    try {
      const res = await fetch("/api/reddit/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subreddits: subreddits.map((s) => s.name),
          months: monthsBack,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scrape failed");
      setResults(data.results);
      setOutput(formatOutput(data.results, monthsBack));
      setProgress(null);
    } catch (err: any) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setScraping(false);
    }
  }

  function formatOutput(results: ScrapeResults, months: number): string {
    const lines: string[] = [];
    lines.push(`# Reddit Research Dump`);
    lines.push(`# Period: Last ${months} months`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push("");

    for (const [sub, { posts, error }] of Object.entries(results)) {
      lines.push(`\n${"=".repeat(60)}`);
      lines.push(`SUBREDDIT: r/${sub}`);
      lines.push(`POSTS: ${posts.length}${error ? ` (error: ${error})` : ""}`);
      lines.push("=".repeat(60));

      for (const p of posts) {
        lines.push("");
        lines.push(`--- POST ---`);
        lines.push(`Title: ${p.title}`);
        lines.push(`Author: u/${p.author} | Score: ${p.score} | Comments: ${p.num_comments}`);
        lines.push(`Date: ${new Date(p.created_utc * 1000).toISOString().split("T")[0]}`);
        lines.push(`URL: ${p.permalink}`);
        if (p.selftext) {
          lines.push(`Body:`);
          lines.push(p.selftext);
        }
      }
    }
    return lines.join("\n");
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalPosts = results ? Object.values(results).reduce((sum, r) => sum + r.posts.length, 0) : 0;

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-bold">Research</h1>
        <div className="ml-4 flex gap-2">
          <Badge variant="outline" className="text-xs">
            {subreddits.length} Subreddits
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto flex-1 p-8 space-y-4">
        {/* Add subreddit */}
        <Card className="p-5 border-none">
          <h2 className="text-sm font-semibold mb-3">Add Subreddit</h2>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. r/webdev or https://reddit.com/r/SaaS"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button onClick={handleAdd} className="cursor-pointer" disabled={!input.trim()}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add subreddit links you want to research. Posts will be scraped from the last few months.
          </p>
        </Card>

        {/* Subreddit list + scrape button */}
        <Card className="p-0 border-none overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-sm font-semibold">Your Subreddits</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">Months back:</span>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={monthsBack}
                  onChange={(e) => setMonthsBack(parseInt(e.target.value) || 3)}
                  className="w-16 h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={handleScrape}
                disabled={scraping || subreddits.length === 0}
                className="cursor-pointer"
              >
                <RefreshCwIcon className={`w-3 h-3 mr-2 ${scraping ? "animate-spin" : ""}`} />
                Scrape All
              </Button>
            </div>
          </div>
          {subreddits.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No subreddits yet. Add some above.
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {subreddits.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <SearchIcon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">r/{s.name}</p>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline truncate flex items-center gap-1"
                    >
                      {s.url}
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </div>
                  {results?.[s.name] && (
                    <Badge variant="outline" className="text-xs">
                      {results[s.name].posts.length} posts
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                    onClick={() => handleRemove(s.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {progress && (
          <Card className="p-4 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCwIcon className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />
              <p>{progress}</p>
            </div>
          </Card>
        )}

        {results && Object.values(results).some((r) => r.error) && (
          <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Some subreddits had errors</p>
                <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                  {Object.entries(results)
                    .filter(([, r]) => r.error)
                    .map(([sub, r]) => (
                      <li key={sub}>r/{sub}: {r.error}</li>
                    ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {output && (
          <Card className="p-0 border-none overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h2 className="text-sm font-semibold">Output</h2>
                <p className="text-xs text-muted-foreground">
                  {totalPosts} posts across {Object.keys(results || {}).length} subreddits · {output.length.toLocaleString()} characters
                </p>
              </div>
              <Button size="sm" onClick={copyOutput} className="cursor-pointer">
                {copied ? (
                  <>
                    <CheckIcon className="w-3 h-3 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3 h-3 mr-2" />
                    Copy All
                  </>
                )}
              </Button>
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-[500px] p-4 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border-0 resize-none focus:outline-none"
            />
          </Card>
        )}
      </div>
    </>
  );
}
