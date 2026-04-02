-- ============================================
-- Add pay_my_debts RPC
-- ============================================

-- Function to allow users to pay their own debts securely, or admins to pay for them.
-- Replaces insecure client-side UPDATE calls.
CREATE OR REPLACE FUNCTION public.pay_my_debts(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is paying for themselves or is admin
  IF auth.uid() <> p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update common expense debts
  UPDATE public.common_expense_debts
  SET pagado = true
  WHERE user_id = p_user_id AND pagado = false;

  -- Update parking debts
  UPDATE public.parking_debts
  SET pagado = true
  WHERE user_id = p_user_id AND pagado = false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.pay_my_debts(uuid) TO authenticated;
