INSERT INTO public.user_roles (user_id, role) VALUES 
('c33341d3-e68b-4af0-8ce4-98e33d258bf8', 'academy'),
('e189b207-2fb0-465f-9cf2-8b06309803db', 'academy'),
('b21fb0a6-45e2-46e7-bb47-df0c9d6bb64b', 'academy')
ON CONFLICT (user_id, role) DO NOTHING;