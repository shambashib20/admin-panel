import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminApi, ApiError } from "@/lib/api";
import type { PaginationMeta, Post } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import { checkProfanity } from "@/lib/profanity";
import type { ProfanityResult } from "@/lib/profanity";

// --- Helpers -----------------------------------------------------------------

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Sub-components ----------------------------------------------------------

function Chip({
  active,
  danger,
  onClick,
  children,
}: {
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? danger
            ? "bg-danger text-white"
            : "bg-accent text-white"
          : danger
            ? "border border-danger/30 text-danger hover:border-danger/60 hover:bg-danger/5"
            : "border border-border text-text-secondary hover:border-accent/40 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

const MEDIA_TONE: Record<string, "accent" | "pending" | "neutral"> = {
  IMAGE: "accent",
  VIDEO: "pending",
  TEXT: "neutral",
};

function MediaBadge({ type }: { type: string | null }) {
  const label = type ?? "TEXT";
  return <Badge tone={MEDIA_TONE[label] ?? "neutral"}>{label}</Badge>;
}

function Avatar({
  name,
  url,
  className = "h-8 w-8",
}: {
  name: string | null;
  url: string | null;
  className?: string;
}) {
  if (url)
    return (
      <img
        src={url}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  return (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold uppercase text-accent`}
    >
      {name?.[0] ?? "?"}
    </span>
  );
}

// --- Post card (grid) --------------------------------------------------------

function PostCard({
  post: p,
  profanity,
  busy,
  onView,
  onDelete,
  onFilterAstrologer,
}: {
  post: Post;
  profanity: ProfanityResult;
  busy: boolean;
  onView: () => void;
  onDelete: () => void;
  onFilterAstrologer: () => void;
}) {
  return (
    <div
      className={`group flex cursor-pointer flex-col gap-3 rounded-xl border bg-surface p-4 transition-colors ${
        profanity.flagged
          ? "border-danger/40 hover:border-danger/60"
          : "border-border hover:border-accent/30"
      }`}
      onClick={onView}
    >
      <div className="flex items-center gap-2">
        <Avatar name={p.astrologerName} url={p.astrologerAvatarUrl} className="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <button
            onClick={(e) => { e.stopPropagation(); onFilterAstrologer(); }}
            className="block max-w-full truncate text-xs font-semibold text-text hover:text-accent hover:underline"
          >
            {p.astrologerName ?? "Unknown"}
          </button>
          <p className="text-[10px] text-text-faint">{fmtDate(p.createdAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {profanity.flagged && <Badge tone="danger">Flagged</Badge>}
          <MediaBadge type={p.mediaType} />
        </div>
      </div>

      {p.mediaUrl && p.mediaType === "IMAGE" && (
        <img src={p.mediaUrl} alt="" className="h-36 w-full rounded-lg object-cover" />
      )}
      {p.mediaUrl && p.mediaType === "VIDEO" && (
        <video src={p.mediaUrl} className="h-36 w-full rounded-lg object-cover" controls onClick={(e) => e.stopPropagation()} />
      )}

      <p className="line-clamp-3 flex-1 text-sm text-text-secondary">{p.content}</p>

      {profanity.flagged && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-danger">Flagged terms</p>
          <p className="mt-0.5 text-xs text-danger/80">{profanity.matches.join(", ")}</p>
        </div>
      )}

      {p.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] text-text-faint">
              #{tag}
            </span>
          ))}
          {p.tags.length > 4 && <span className="text-[10px] text-text-faint">+{p.tags.length - 4} more</span>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={onView} className="cursor-pointer text-xs font-medium text-accent hover:underline">View full post</button>
        <button disabled={busy} onClick={onDelete} className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-danger/30 hover:text-danger disabled:opacity-40">Remove</button>
      </div>
    </div>
  );
}

// --- Icons -------------------------------------------------------------------

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// --- Constants ---------------------------------------------------------------

const MEDIA_OPTS = [
  { label: "All types", value: "" },
  { label: "Image", value: "IMAGE" },
  { label: "Video", value: "VIDEO" },
  { label: "Text", value: "TEXT" },
];

const FLAG_OPTS = [
  { label: "All", value: "" },
  { label: "Flagged only", value: "flagged" },
  { label: "Clean only", value: "clean" },
];

// --- Main page ---------------------------------------------------------------

type ViewMode = "grid" | "table";

export function Posts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [detailPost, setDetailPost] = useState<{ post: Post; profanity: ProfanityResult } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const astrologerId = searchParams.get("astrologerId") ?? undefined;
  const astrologerName = searchParams.get("astrologerName") ?? undefined;
  const mediaFilter = searchParams.get("media") ?? "";
  const flagFilter = searchParams.get("flag") ?? "";

  const load = () => {
    setLoading(true);
    adminApi
      .listPosts({ search, page, astrologerId })
      .then((res) => { setPosts(res.posts); setMeta(res.meta); setError(null); })
      .catch(() => setError("Failed to load posts."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, page, astrologerId]);

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== "") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const onSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("search", val.trim() || undefined), 400);
  };

  const filterByAstrologer = (id: string, name: string | null) => {
    const next = new URLSearchParams();
    next.set("astrologerId", id);
    if (name) next.set("astrologerName", name);
    setSearchParams(next);
    setSearchInput("");
  };

  const clearAstrologerFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("astrologerId");
    next.delete("astrologerName");
    next.delete("page");
    setSearchParams(next);
  };

  // Annotate each post with its profanity result (pure regex, no network)
  const annotated = posts.map((p) => ({
    post: p,
    profanity: checkProfanity([p.content, ...p.tags].join(" ")),
  }));

  // Stack client-side filters on top of server results
  const visiblePosts = annotated
    .filter(({ post: p }) => !mediaFilter || (p.mediaType ?? "TEXT") === mediaFilter)
    .filter(({ profanity }) => {
      if (flagFilter === "flagged") return profanity.flagged;
      if (flagFilter === "clean") return !profanity.flagged;
      return true;
    });

  const pageImages = posts.filter((p) => p.mediaType === "IMAGE").length;
  const pageVideos = posts.filter((p) => p.mediaType === "VIDEO").length;
  const pageText = posts.filter((p) => !p.mediaType || p.mediaType === "TEXT").length;
  const pageFlagged = annotated.filter(({ profanity }) => profanity.flagged).length;

  const confirmDelete = async (post: Post) => {
    setBusyId(post.id);
    try {
      await adminApi.deletePost(post.id);
      setDeleteTarget(null);
      setDetailPost(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Posts</h1>
          {meta && <p className="mt-0.5 text-xs text-text-faint">{meta.total.toLocaleString()} total posts</p>}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-alt p-1">
          <button title="Grid view" onClick={() => setViewMode("grid")} className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-surface text-text shadow-sm" : "text-text-faint hover:text-text"}`}><IconGrid /></button>
          <button title="Table view" onClick={() => setViewMode("table")} className={`rounded-md p-1.5 transition-colors ${viewMode === "table" ? "bg-surface text-text shadow-sm" : "text-text-faint hover:text-text"}`}><IconTable /></button>
        </div>
      </div>

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-faint">Total Posts</p>
            <p className="mt-1 text-2xl font-semibold text-text">{meta.total.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-faint">Images</p>
            <p className="mt-1 text-2xl font-semibold text-accent">{pageImages}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-faint">Videos</p>
            <p className="mt-1 text-2xl font-semibold text-pending">{pageVideos}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-faint">Text only</p>
            <p className="mt-1 text-2xl font-semibold text-text-secondary">{pageText}</p>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => pageFlagged > 0 && updateParam("flag", "flagged")}
            onKeyDown={(e) => e.key === "Enter" && pageFlagged > 0 && updateParam("flag", "flagged")}
            className={`rounded-xl border p-4 transition-colors ${pageFlagged > 0 ? "cursor-pointer border-danger/30 bg-danger/5 hover:bg-danger/10" : "border-border bg-surface"}`}
          >
            <p className="text-xs text-text-faint">Flagged</p>
            <p className={`mt-1 text-2xl font-semibold ${pageFlagged > 0 ? "text-danger" : "text-text-secondary"}`}>{pageFlagged}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <IconSearch />
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search post content..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-9 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); updateParam("search", undefined); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text">x</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {astrologerId && (
            <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 py-1 pl-3 pr-2 text-xs font-medium text-accent">
              <span>Astrologer: {astrologerName ?? astrologerId.slice(0, 8)}</span>
              <button onClick={clearAstrologerFilter} className="hover:opacity-70">x</button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-faint">Type</span>
            {MEDIA_OPTS.map((opt) => (
              <Chip key={opt.value} active={mediaFilter === opt.value} onClick={() => updateParam("media", opt.value || undefined)}>{opt.label}</Chip>
            ))}
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-faint">Profanity</span>
            {FLAG_OPTS.map((opt) => (
              <Chip key={opt.value} active={flagFilter === opt.value} danger={opt.value === "flagged"} onClick={() => updateParam("flag", opt.value || undefined)}>{opt.label}</Chip>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</p>}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-text-faint">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
          <span className="text-xs">Loading posts...</span>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-20 text-center text-sm text-text-faint">No posts found.</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map(({ post: p, profanity }) => (
            <PostCard
              key={p.id}
              post={p}
              profanity={profanity}
              busy={busyId === p.id}
              onView={() => setDetailPost({ post: p, profanity })}
              onDelete={() => setDeleteTarget(p)}
              onFilterAstrologer={() => filterByAstrologer(p.astrologerId, p.astrologerName)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Astrologer</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium">Flagged</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {visiblePosts.map(({ post: p, profanity }) => (
                <tr
                  key={p.id}
                  className={`group cursor-pointer transition-colors ${profanity.flagged ? "bg-danger/5 hover:bg-danger/10" : "hover:bg-surface-alt/50"}`}
                  onClick={() => setDetailPost({ post: p, profanity })}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.astrologerName} url={p.astrologerAvatarUrl} className="h-7 w-7" />
                      <button onClick={(e) => { e.stopPropagation(); filterByAstrologer(p.astrologerId, p.astrologerName); }} className="text-sm font-medium text-text hover:text-accent hover:underline">
                        {p.astrologerName ?? "-"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3"><MediaBadge type={p.mediaType} /></td>
                  <td className="max-w-xs px-4 py-3"><p className="truncate text-xs text-text-secondary">{p.content}</p></td>
                  <td className="px-4 py-3">
                    {profanity.flagged ? (
                      <span title={profanity.matches.join(", ")} className="inline-flex cursor-help items-center gap-1 rounded-full border border-danger/20 bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                        {profanity.matches.length === 1 ? "1 term" : `${profanity.matches.length} terms`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-faint">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] text-text-faint">{tag}</span>
                      ))}
                      {p.tags.length > 2 && <span className="text-[10px] text-text-faint">+{p.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-text-faint">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDetailPost({ post: p, profanity })} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent">View</button>
                      <button disabled={busyId === p.id} onClick={() => setDeleteTarget(p)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-danger/30 hover:text-danger disabled:opacity-40">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={(p) => updateParam("page", String(p))} />}
        </div>
      )}

      {viewMode === "grid" && meta && (
        <div className="rounded-xl border border-border bg-surface">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={(p) => updateParam("page", String(p))} />
        </div>
      )}

      {/* Post detail modal */}
      <Modal open={!!detailPost} onClose={() => setDetailPost(null)} title="Post details" width="max-w-2xl">
        {detailPost && (
          <div className="space-y-4">
            {detailPost.profanity.flagged && (
              <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-3">
                <div>
                  <p className="text-sm font-semibold text-danger">Profanity detected</p>
                  <p className="mt-0.5 text-xs text-danger/80">Flagged terms: <span className="font-medium">{detailPost.profanity.matches.join(", ")}</span></p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Avatar name={detailPost.post.astrologerName} url={detailPost.post.astrologerAvatarUrl} className="h-10 w-10" />
              <div>
                <button onClick={() => { filterByAstrologer(detailPost.post.astrologerId, detailPost.post.astrologerName); setDetailPost(null); }} className="text-sm font-semibold text-text hover:text-accent hover:underline">
                  {detailPost.post.astrologerName ?? "Unknown"}
                </button>
                <p className="text-xs text-text-faint">{fmtDateTime(detailPost.post.createdAt)}</p>
              </div>
              <div className="ml-auto shrink-0"><MediaBadge type={detailPost.post.mediaType} /></div>
            </div>
            {detailPost.post.mediaUrl && detailPost.post.mediaType === "IMAGE" && (
              <img src={detailPost.post.mediaUrl} alt="" className="max-h-96 w-full rounded-xl object-cover" />
            )}
            {detailPost.post.mediaUrl && detailPost.post.mediaType === "VIDEO" && (
              <video src={detailPost.post.mediaUrl} className="max-h-96 w-full rounded-xl" controls />
            )}
            <div className="rounded-lg border border-border bg-surface-alt p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{detailPost.post.content}</p>
            </div>
            {detailPost.post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detailPost.post.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-surface-alt px-2.5 py-1 text-xs text-text-faint">#{tag}</span>
                ))}
              </div>
            )}
            <div className="rounded-lg border border-border bg-surface-alt px-3 py-2 font-mono text-xs text-text-faint">Post ID: {detailPost.post.id}</div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button onClick={() => setDetailPost(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt">Close</button>
              <button disabled={busyId === detailPost.post.id} onClick={() => { setDeleteTarget(detailPost.post); setDetailPost(null); }} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Remove post</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove post">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Remove this post by <span className="font-medium text-text">{deleteTarget.astrologerName}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt">Cancel</button>
              <button disabled={busyId === deleteTarget.id} onClick={() => confirmDelete(deleteTarget)} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Remove post</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
