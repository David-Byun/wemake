CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id uuid) 
RETURNS TABLE (
    views bigint,
    month text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS views,
        TO_CHAR(events.created_at, 'YYYY-MM') AS month
    FROM public.events 
    JOIN public.profiles ON profiles.profile_id = user_id
    AND event_data ->> 'username' = profiles.username
    GROUP BY month
    ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;
