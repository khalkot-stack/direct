CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view their messages"
ON public.messages FOR SELECT
USING (
  (auth.uid() = sender_id) OR (auth.uid() = receiver_id)
);

CREATE POLICY "Allow authenticated users to insert messages"
ON public.messages FOR INSERT
WITH CHECK (
  (auth.uid() = sender_id)
);