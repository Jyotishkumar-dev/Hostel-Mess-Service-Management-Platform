"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Info, Send, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { CATEGORY_LABELS, AREA_LABELS } from "@/config/status";
import {
  complaintDraftDefaults,
  complaintDraftSchema,
  type ComplaintDraftValues,
} from "@/lib/validations";
import { COMPLAINT_CATEGORIES, SERVICE_AREAS } from "@/types/complaint";

/**
 * The "submit feedback" form.
 *
 * It is fully wired to React Hook Form and validated by the Zod schema in
 * `@/lib/validations` — nothing about validation lives in this file. In
 * Phase 1 the submit handler deliberately does not persist anything; it only
 * confirms that the schema accepted the input. The real Server Action writes
 * to Supabase in Phase 2.
 */
export function ComplaintForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintDraftValues>({
    resolver: zodResolver(complaintDraftSchema),
    defaultValues: complaintDraftDefaults,
  });

  const area = watch("area");
  const category = watch("category");

  const onSubmit = async () => {
    // No database yet — Phase 2 replaces this with a Server Action.
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitted(true);
    reset(complaintDraftDefaults);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Where is the problem?</legend>
        <p className="text-sm text-muted-foreground">
          This decides which team picks the issue up.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SERVICE_AREAS.map((option) => {
            const Icon = option === "hostel" ? Building2 : Utensils;
            const isSelected = area === option;

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
                  value={option}
                  checked={isSelected}
                  onChange={() => setValue("area", option, { shouldValidate: true })}
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
        {errors.area ? (
          <p className="text-sm text-destructive">{errors.area.message}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              setValue("category", value as ComplaintDraftValues["category"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="category" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {COMPLAINT_CATEGORIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {CATEGORY_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category ? (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Block C, Room 314"
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? "location-error" : undefined}
            {...register("location")}
          />
          {errors.location ? (
            <p id="location-error" className="text-sm text-destructive">
              {errors.location.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Summary</Label>
        <Input
          id="title"
          placeholder="One line describing the problem"
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">What happened?</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Describe what you noticed, when it started and how it affects you."
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <div className="flex items-start justify-between gap-4">
          {errors.description ? (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              A clear description helps the team act on the first visit.
            </p>
          )}
        </div>
      </div>

      {submitted ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg bg-status-assigned-bg px-3.5 py-3 text-sm text-status-assigned-fg"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Your report passed validation and is ready to submit. Saving it to
            the database is wired up in Phase 2.
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          <Send aria-hidden="true" />
          {isSubmitting ? "Checking…" : "Submit report"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Nothing is saved yet in Phase 1 — this form only demonstrates the
          validation setup.
        </p>
      </div>
    </form>
  );
}
