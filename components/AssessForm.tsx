"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CATEGORIES, STATES, BUDGET_OPTIONS } from "@/lib/constants";

type FormState = {
  neet_score: string;
  category: string;
  state: string;
  budget_preference: string;
};

const INITIAL: FormState = {
  neet_score: "",
  category: "",
  state: "",
  budget_preference: "government_only",
};

export function AssessForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    const score = parseInt(form.neet_score);
    if (isNaN(score) || score < 0 || score > 720) {
      errs.neet_score = "Enter a score between 0 and 720";
    }
    if (!form.category) errs.category = "Select your category";
    if (!form.state) errs.state = "Select your state";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          neet_score: parseInt(form.neet_score),
          category: form.category,
          state: form.state,
          budget_preference: form.budget_preference || "government_only",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Something went wrong");
      }

      const data = await res.json() as { assessment_id: string };
      router.push(`/results/${data.assessment_id}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-6"
    >
      {/* Score */}
      <div className="space-y-2">
        <Label htmlFor="score" className="text-sm font-medium text-foreground">
          NEET Score <span className="text-muted-foreground font-normal">(out of 720)</span>
        </Label>
        <Input
          id="score"
          type="number"
          inputMode="numeric"
          min={0}
          max={720}
          placeholder="e.g. 520"
          value={form.neet_score}
          onChange={(e) => {
            setForm((f) => ({ ...f, neet_score: e.target.value }));
            if (errors.neet_score) setErrors((er) => ({ ...er, neet_score: undefined }));
          }}
          className="text-base h-12"
        />
        {errors.neet_score && (
          <p className="text-xs text-red-600 dark:text-red-300">{errors.neet_score}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Category</Label>
        <Select
          value={form.category}
          onValueChange={(val) => {
            setForm((f) => ({ ...f, category: val ?? "" }));
            if (errors.category) setErrors((er) => ({ ...er, category: undefined }));
          }}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select your category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-red-600 dark:text-red-300">{errors.category}</p>
        )}
      </div>

      {/* State */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          State of Domicile{" "}
          <span className="text-muted-foreground font-normal text-xs">(where you are a resident)</span>
        </Label>
        <Select
          value={form.state}
          onValueChange={(val) => {
            setForm((f) => ({ ...f, state: val ?? "" }));
            if (errors.state) setErrors((er) => ({ ...er, state: undefined }));
          }}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent>
            {STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.state && (
          <p className="text-xs text-red-600 dark:text-red-300">{errors.state}</p>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Budget preference{" "}
          <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </Label>
        <div className="space-y-2">
          {BUDGET_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                form.budget_preference === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="budget"
                value={opt.value}
                checked={form.budget_preference === opt.value}
                onChange={() =>
                  setForm((f) => ({ ...f, budget_preference: opt.value }))
                }
                className="mt-0.5 accent-[var(--primary)]"
              />
              <div>
                <div className="text-sm font-medium text-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-700 bg-red-50 dark:bg-red-400/15 dark:text-red-200 px-3 py-2 rounded-lg">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-lg"
      >
        {loading ? "Generating your plan..." : "Get my counselling plan"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your inputs are not stored or linked to any account.
      </p>
    </form>
  );
}
