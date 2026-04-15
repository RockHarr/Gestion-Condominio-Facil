-- Fix remaining "Function Search Path Mutable" warning
-- This warning comes from a legacy version of submit_vote(bigint, integer) 
-- that was superseded by submit_vote(bigint, bigint) in the new voting module.
-- Since the table structure changed to use option_id instead of option_index, this function is obsolete.

DROP FUNCTION IF EXISTS public.submit_vote(BIGINT, INTEGER);
