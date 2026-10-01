"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
  Send,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/feedback/image-uploader";
import { AREA_LABELS, categoryOptionsFor } from "@/config/status";
import {
  complaintDefaults,
  complaintSchema,
  defaultCategoryFor,
  type ComplaintValues,
} from "@/lib/validations";
import { createComplaintAction } from "@/lib/complaints/actions";
import { INITIAL_COMPLAINT_STATE } from "@/lib/complaints/state";
import {
  AREA_LOCATION_SUGGESTIONS,
  SERVICE_AREAS,
  type ServiceArea,
} from "@/types/complaint";

/**
 * The student feedback form.
 *
 * React Hook Form owns the fields, Zod owns validation (see
 * `@/lib/validations`), and `createComplaintAction` owns persistence. This file
 * contains no rules — it only wires the three together and renders the result.
 *
 * The owner, status and priority are decided on the server, so this form has no
 * way to set them even if someone edits the request.
 */
export function ComplaintForm() {
  const [state, formAction, isPending] = useActionState(
    createComplaintAction,
    INITIAL_COMPLAINT_STATE,
  );

  // Held outside React Hook Form because a File cannot be a form value.
  const [photo, setPhoto] = useState<File | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ComplaintValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: complaintDefaults,
  });

  // `useWatch` subscribes to single fields without re-rendering on every keypress
  // in the description box.
  const serviceType = useWatch({ control, name: "serviceType" });
  const category = useWatch({ control, name: "category" });

  const [, startTransition] = useTransition();

  // Server-side validation runs last, so its errors land after the render that
  // first tried to submit them.
  useEffect(() => {
    const fieldErrors = state.fieldErrors;
    if (!fieldErrors) return;

    for (const [field, message] of Object.entries(fieldErrors)) {
      setError(field as keyof ComplaintValues, { type: "server", message });
    }
  }, [state, setError]);

  const onSubmit = handleSubmit((values) => {
    clearErrors();

    const payload = new FormData();
    payload.set("serviceType", values.serviceType);
    payload.set("category", values.category);
    payload.set("title", values.title);
    payload.set("description", values.description);
    payload.set("location", values.location);
    if (photo) payload.set("photo", photo);

    startTransition(() => formAction(payload));
  });

  // Success: replace the form with a confirmation the student can act on.
  if (state.status === "success" && state.complaint) {
    return (
      <SubmittedConfirmation
        reference={state.complaint.reference}
        createdAt={state.complaint.createdAt}
      />
    );
  }

  const categories = categoryOptionsFor(serviceType as ServiceArea);
  const suggestions = AREA_LOCATION_SUGGESTIONS[serviceType as ServiceArea];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </p>
      ) : null}

      {/* 1 — Service ------------------------------------------------------- */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-medium">1. Where is the problem?</h2>
          <p className="text-sm text-muted-foreground">
            This decides which team picks the issue up.
          </p>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SERVICE_AREAS.map((option) => {
            const Icon = option === "hostel" ? Building2 : Utensils;
            const isSelected = serviceType === option;

            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                  "has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2",
                  isSelected
                    ? "border-primary bg-accent/50"
                    : "hover:bg-accent/30",
                )}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value={option}
                  checked={isSelected}
                  onChange={() => {
                    setValue("serviceType", option, { shouldValidate: true });
                    // Categories differ per service, so move to that service's
                    // first category instead of leaving an invalid one selected.
                    setValue("category", defaultCategoryFor(option), {
                      shouldValidate: true,
                    });
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {AREA_LABELS[option]}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {option === "hostel"
                      ? "Rooms, common areas, water, power, internet"
                      : "Food quality, hygiene, serving, dining hours"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {errors.serviceType ? (
          <p className="text-sm text-destructive">{errors.serviceType.message}</p>
        ) : null}
      </section>

      {/* 2 — Category ------------------------------------------------------ */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-medium">2. What kind of issue is it?</h2>
          <p className="text-sm text-muted-foreground">
            Showing {AREA_LABELS[serviceType as ServiceArea].toLowerCase()}{" "}
            categories.
          </p>
        </div>

        <div className="mt-2">
          <Label htmlFor="category" className="sr-only">
            Category
          </Label>
          <Select
            value={category}
            onValueChange={(value) =>
              setValue("category", value as ComplaintValues["category"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="category" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {errors.category ? (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        ) : null}
      </section>

      {/* 3 — Location ------------------------------------------------------ */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-medium">3. Where exactly?</h2>
          <p className="text-sm text-muted-foreground">
            Be as specific as you can — it saves the team a trip.
          </p>
        </div>

        <div className="mt-2">
          <Label htmlFor="location" className="sr-only">
            Location
          </Label>
          <Input
            id="location"
            placeholder={
              serviceType === "hostel" ? "Block B, 3rd Floor" : "Main Mess"
            }
            aria-invalid={!!errors.location}
            aria-describedby={
              errors.location ? "location-error" : "location-hint"
            }
            {...register("location")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Common:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() =>
                setValue("location", suggestion, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-ring focus-visible:ring-2"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {errors.location ? (
          <p id="location-error" className="text-sm text-destructive">
            {errors.location.message}
          </p>
        ) : (
          <p id="location-hint" className="text-xs text-muted-foreground">
            Type your own if none of these fit.
          </p>
        )}
      </section>

      {/* 4 — Details ------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-medium">4. Tell us what happened</h2>
          <p className="text-sm text-muted-foreground">
            The more detail you give, the faster it gets sorted.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Water cooler not working"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            {...register("title")}
          />
          {errors.title ? (
            <p id="title-error" className="text-sm text-destructive">
              {errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={6}
            placeholder="The drinking water cooler near Block B, third floor has not been working since yesterday."
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "description-error" : "description-hint"
            }
            {...register("description")}
          />
          <div className="flex flex-wrap items-start justify-between gap-2">
            {errors.description ? (
              <p id="description-error" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : (
              <p id="description-hint" className="text-xs text-muted-foreground">
                Mention when it started and how it affects you.
              </p>
            )}
            <DescriptionCounter control={control} />
          </div>
        </div>
      </section>

      {/* 5 — Photo --------------------------------------------------------- */}
      <section className="border-t pt-7">
        <h2 className="mb-3 text-sm font-medium">5. Add a photo</h2>
        <ImageUploader
          onChange={setPhoto}
          error={state.fieldErrors?.photo}
          disabled={isPending}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            <>
              <Send aria-hidden="true" />
              Submit Feedback
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          {isPending
            ? "Saving your feedback — please keep this page open."
            : "Your report goes straight to the hostel or mess team."}
        </p>
      </div>
    </form>
  );
}

/** Live character count, so the minimum description length is discoverable. */
function DescriptionCounter({
  control,
}: {
  control: ReturnType<typeof useForm<ComplaintValues>>["control"];
}) {
  const description = useWatch({ control, name: "description" }) ?? "";
  const length = description.trim().length;
  const met = length >= 20;

  return (
    <p
      className={cn(
        "text-xs tabular-nums",
        met ? "text-muted-foreground" : "text-muted-foreground/70",
      )}
    >
      {length >= 20 ? (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          Enough detail
        </span>
      ) : (
        `${20 - length} more character${20 - length === 1 ? "" : "s"} needed`
      )}
    </p>
  );
}

/**
 * Shown after a successful submit.
 *
 * Deliberately states only what is true: the report is recorded and awaiting
 * review. It does not suggest anyone has been assigned or that anything is fixed.
 */
function SubmittedConfirmation({
  reference,
  createdAt,
}: {
  reference: string;
  createdAt: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-5 rounded-xl border border-status-reported/25 bg-status-reported-bg/50 p-6"
    >
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-status-reported/15 text-status-reported"
      >
        <CheckCircle2 className="size-6" />
      </span>

      <div>
        <h2 className="text-lg font-semibold">Feedback submitted successfully</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your issue has been recorded and is waiting to be reviewed by the
          hostel or mess team.
        </p>
      </div>

      <dl className="grid w-full gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Complaint ID</dt>
          <dd className="mt-0.5 font-mono text-sm font-medium">{reference}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Current status</dt>
          <dd className="mt-0.5 text-sm font-medium">Reported</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Submitted</dt>
          <dd className="mt-0.5 text-sm font-medium">
            {formatDateTime(createdAt)}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/student/complaints">
            View my complaints
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/student/complaints/new">Submit another</Link>
        </Button>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Keep the reference <strong>{reference}</strong> handy. You can follow
          the status of this report from your complaints list at any time.
        </span>
      </p>
    </div>
  );
}