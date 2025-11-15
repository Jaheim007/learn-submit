-- Enable pg_net extension for making HTTP requests from database
create extension if not exists pg_net with schema extensions;

-- Create function to send push notification when notification is created
create or replace function public.trigger_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id bigint;
begin
  -- Call the send-push-notification edge function asynchronously
  select extensions.http_post(
    url := 'https://ucgaxcnfvrbhsxxcwceo.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(NEW.user_id),
      'title', NEW.title,
      'body', NEW.body,
      'data', NEW.metadata
    )
  ) into request_id;
  
  return NEW;
end;
$$;

-- Create trigger on notifications table to send push notifications
drop trigger if exists on_notification_created on public.notifications;
create trigger on_notification_created
  after insert on public.notifications
  for each row
  execute function public.trigger_push_notification();

-- Create notification trigger for submission status updates
create or replace function public.notify_student_submission_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_user_id uuid;
  student_name text;
  project_title text;
  status_text text;
begin
  -- Get student info
  select s.user_id, s.full_name into student_user_id, student_name
  from public.students s
  where s.id = NEW.student_id;
  
  -- Get project title
  select p.title into project_title
  from public.projects p
  where p.id = NEW.project_id;
  
  -- Only notify on status changes (not initial submission)
  if TG_OP = 'UPDATE' and OLD.status != NEW.status then
    case NEW.status
      when 'Validé' then status_text := 'validé ✅';
      when 'Refusé' then status_text := 'refusé ❌';
      when 'En révision' then status_text := 'en cours de révision 🔍';
      else status_text := NEW.status;
    end case;
    
    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      metadata
    ) values (
      student_user_id,
      'submission_status_updated',
      'Mise à jour de soumission',
      'Votre projet "' || project_title || '" a été ' || status_text,
      jsonb_build_object(
        'submission_id', NEW.id,
        'project_id', NEW.project_id,
        'status', NEW.status
      )
    );
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for submission updates
drop trigger if exists on_submission_status_changed on public.submissions;
create trigger on_submission_status_changed
  after update on public.submissions
  for each row
  execute function public.notify_student_submission_update();