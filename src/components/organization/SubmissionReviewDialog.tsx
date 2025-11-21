import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, ExternalLink } from "lucide-react";

interface Submission {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  student_id: string;
}

interface SubmissionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  onReviewCompleted: () => void;
}

export function SubmissionReviewDialog({
  open,
  onOpenChange,
  submission,
  onReviewCompleted,
}: SubmissionReviewDialogProps) {
  const [status, setStatus] = useState(submission?.status || "pending");
  const [grade, setGrade] = useState(submission?.grade?.toString() || "");
  const [feedback, setFeedback] = useState(submission?.feedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submission) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('submito_organization_submissions')
        .update({
          status,
          grade: grade ? parseFloat(grade) : null,
          feedback: feedback.trim() || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success("Review submitted successfully");
      onReviewCompleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Submission: {submission.title}</DialogTitle>
          <DialogDescription>
            Provide feedback and grade for this submission
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Submission Details */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Description:</p>
              <p className="text-sm text-muted-foreground">
                {submission.description || "No description provided"}
              </p>
            </div>
            
            {submission.file_url && (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">File:</p>
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View File <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium">Submitted:</p>
              <p className="text-sm text-muted-foreground">
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Enter grade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
