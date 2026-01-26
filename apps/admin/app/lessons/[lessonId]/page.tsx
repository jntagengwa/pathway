"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Badge, Button, Card } from "@pathway/ui";
import {
  AdminLessonDetail,
  fetchLessonById,
} from "../../../lib/api-client";

const statusTone: Record<
  AdminLessonDetail["status"],
  "default" | "accent" | "success"
> = {
  draft: "default",
  published: "success",
  archived: "default",
  unknown: "default",
};

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = params.lessonId;

  const [lesson, setLesson] = React.useState<AdminLessonDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchLessonById(lessonId);
      if (!result) {
        setNotFound(true);
        setLesson(null);
      } else {
        setLesson(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lesson");
      setLesson(null);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const renderDescription = (text: string | null) => {
    if (!text) return <p className="text-sm text-text-muted">No description provided.</p>;
    return text.split("\n").map((para, idx) => (
      <p key={idx} className="text-sm text-text-primary">
        {para}
      </p>
    ));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="secondary" size="sm">
          <Link href="/lessons" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to lessons
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href={`/lessons/${lessonId}/edit`}>Edit lesson</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </div>
          </Card>
          <Card>
            <div className="flex flex-col gap-3">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </Card>
        </div>
      ) : notFound ? (
        <Card title="Lesson Not Found">
          <p className="text-sm text-text-muted">
            We couldn’t find a lesson matching id <strong>{lessonId}</strong>.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push("/lessons")}>
              Back to lessons
            </Button>
          </div>
        </Card>
      ) : error ? (
        <Card title="Error Loading Lesson">
          <p className="text-sm text-text-muted">{error}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/lessons")}>
              Back
            </Button>
            <Button onClick={load}>Retry</Button>
          </div>
        </Card>
      ) : lesson ? (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-text-primary font-heading">
                  {lesson.title}
                </h1>
                <Badge variant={statusTone[lesson.status]}>
                  {lesson.status}
                </Badge>
              </div>
              <p className="text-sm text-text-muted">
                Age group: {lesson.ageGroupLabel ?? "Not set"} · Group:{" "}
                {lesson.groupLabel ?? "Not set"}
              </p>
              <p className="text-xs text-text-muted">
                Updated: {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleString() : "-"}
              </p>
            </div>
          </Card>

          <Card title="Description">
            {renderDescription(lesson.description)}
          </Card>

          <Card title="Resources">
            {lesson.resources.length === 0 ? (
              <p className="text-sm text-text-muted">
                No resources attached to this lesson yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lesson.resources.map((res) => (
                  <li key={res.id} className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-text-muted" />
                    <span>{res.label}</span>
                    {res.type ? (
                      <Badge variant="secondary" className="capitalize">
                        {res.type}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-text-muted">
              {/* LESSONS: resources are shown by label only; do not expose raw S3 URLs or tokens here. */}
              Resources are shown by label only; do not expose raw S3 URLs or tokens here.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

