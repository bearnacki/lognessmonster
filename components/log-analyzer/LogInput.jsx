"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

export default function LogInput({ onLogsSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data) => {
    setIsSubmitting(true);
    try {
      onLogsSubmit(data.logs);
      reset();
    } catch (error) {
      console.error("Error processing logs:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="logs" className="block text-sm font-medium mb-1">
              Paste your logs here
            </label>
            <textarea
              id="logs"
              {...register("logs", { required: "Log data is required" })}
              className="w-full h-64 p-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste your log data here..."
            />
            {errors.logs && (
              <p className="mt-1 text-sm text-red-600">{errors.logs.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="px-4 py-2">
              {isSubmitting ? "Processing..." : "Analyze Logs"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
