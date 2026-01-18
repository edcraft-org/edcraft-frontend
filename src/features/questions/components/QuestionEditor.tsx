// QuestionEditor component - Edit or create questions with support for different question types

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2, Check } from "lucide-react";
import type {
  QuestionType,
  Question,
  MCQAdditionalData,
  ShortAnswerAdditionalData,
} from "../types/question.types";

// Schema for the question form
const questionFormSchema = z.object({
  question_type: z.enum(["mcq", "mrq", "short_answer"]),
  question_text: z.string().min(1, "Question text is required"),
  // For MCQ/MRQ
  options: z.array(z.object({ value: z.string().min(1, "Option cannot be empty") })).optional(),
  correct_indices: z.array(z.number()).optional(),
  // For Short Answer
  answer: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionEditorProps {
  question?: Question;
  onSave: (data: {
    question_type: QuestionType;
    question_text: string;
    additional_data: MCQAdditionalData | ShortAnswerAdditionalData;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function QuestionEditor({
  question,
  onSave,
  onCancel,
  isLoading,
}: QuestionEditorProps) {
  // Parse existing question data
  const existingOptions =
    question?.additional_data && "options" in question.additional_data
      ? question.additional_data.options.map((v) => ({ value: v }))
      : [{ value: "" }, { value: "" }];

  const existingCorrectIndices =
    question?.additional_data && "correct_indices" in question.additional_data
      ? question.additional_data.correct_indices
      : [];

  const existingAnswer =
    question?.additional_data && "answer" in question.additional_data
      ? question.additional_data.answer
      : "";

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question_type: question?.question_type || "mcq",
      question_text: question?.question_text || "",
      options: existingOptions,
      correct_indices: existingCorrectIndices,
      answer: existingAnswer,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const questionType = form.watch("question_type");
  const correctIndices = form.watch("correct_indices") || [];

  const handleSubmit = (values: QuestionFormValues) => {
    let additional_data: MCQAdditionalData | ShortAnswerAdditionalData;

    if (values.question_type === "short_answer") {
      additional_data = {
        answer: values.answer || "",
      };
    } else {
      // MCQ or MRQ
      const options = values.options?.map((o) => o.value) || [];
      const indices = values.correct_indices || [];
      additional_data = {
        options,
        correct_indices: indices,
        answer: indices.length > 0 ? options[indices[0]] || "" : "",
      };
    }

    onSave({
      question_type: values.question_type,
      question_text: values.question_text,
      additional_data,
    });
  };

  const toggleCorrectIndex = (index: number) => {
    const current = form.getValues("correct_indices") || [];
    const type = form.getValues("question_type");

    if (type === "mcq") {
      // Single selection - replace
      form.setValue("correct_indices", [index]);
    } else {
      // Multiple selection - toggle
      if (current.includes(index)) {
        form.setValue(
          "correct_indices",
          current.filter((i) => i !== index)
        );
      } else {
        form.setValue("correct_indices", [...current, index]);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Question Type */}
        <FormField
          control={form.control}
          name="question_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset correct indices when changing type
                  form.setValue("correct_indices", []);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice (Single Answer)</SelectItem>
                  <SelectItem value="mrq">Multiple Response (Multiple Answers)</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Question Text */}
        <FormField
          control={form.control}
          name="question_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your question..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options for MCQ/MRQ */}
        {(questionType === "mcq" || questionType === "mrq") && (
          <div className="space-y-3">
            <Label>
              Options{" "}
              <span className="text-muted-foreground text-sm">
                (Click to mark as correct)
              </span>
            </Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={correctIndices.includes(index) ? "default" : "outline"}
                  size="icon"
                  className="shrink-0"
                  onClick={() => toggleCorrectIndex(index)}
                >
                  {correctIndices.includes(index) && <Check className="h-4 w-4" />}
                </Button>
                <FormField
                  control={form.control}
                  name={`options.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    remove(index);
                    // Update correct indices after removal
                    const current = form.getValues("correct_indices") || [];
                    form.setValue(
                      "correct_indices",
                      current
                        .filter((i) => i !== index)
                        .map((i) => (i > index ? i - 1 : i))
                    );
                  }}
                  disabled={fields.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        )}

        {/* Answer for Short Answer */}
        {questionType === "short_answer" && (
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Answer</FormLabel>
                <FormControl>
                  <Input placeholder="Enter the expected answer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : question ? "Update Question" : "Create Question"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
