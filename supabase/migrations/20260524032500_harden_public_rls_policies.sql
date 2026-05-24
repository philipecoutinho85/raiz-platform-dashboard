-- Harden public RLS policies on sensitive tables.
--
-- Context:
-- Audit identified multiple policies created for role PUBLIC on sensitive tables.
-- Many still had safe auth.uid()/admin predicates, but using TO authenticated is clearer and safer.
-- The broad notifications INSERT policy with WITH CHECK true is removed and replaced with authenticated self-only insertion.
--
-- This migration does not disable legitimate authenticated access.
-- It reduces accidental anon/public exposure.

-- creator_payouts
DROP POLICY IF EXISTS "Admin master can delete creator_payouts" ON public.creator_payouts;
CREATE POLICY "Admin master can delete creator_payouts"
ON public.creator_payouts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.admin_type = 'master'::admin_type
  )
);

DROP POLICY IF EXISTS "Admins can manage creator_payouts" ON public.creator_payouts;
CREATE POLICY "Admins can manage creator_payouts"
ON public.creator_payouts
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all payouts" ON public.creator_payouts;
CREATE POLICY "Admins can view all payouts"
ON public.creator_payouts
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own payouts" ON public.creator_payouts;
CREATE POLICY "Users can view their own payouts"
ON public.creator_payouts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create own notifications"
ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- project_contributions
DROP POLICY IF EXISTS "Admin master can delete project_contributions" ON public.project_contributions;
CREATE POLICY "Admin master can delete project_contributions"
ON public.project_contributions
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.admin_type = 'master'::admin_type
  )
);

DROP POLICY IF EXISTS "Anyone can view project contributions" ON public.project_contributions;
CREATE POLICY "Admins can view all project contributions"
ON public.project_contributions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own contributions" ON public.project_contributions;
CREATE POLICY "Users can create their own contributions"
ON public.project_contributions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own contributions" ON public.project_contributions;
CREATE POLICY "Users can view their own contributions"
ON public.project_contributions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- refunds
DROP POLICY IF EXISTS "Admin master can delete refunds" ON public.refunds;
CREATE POLICY "Admin master can delete refunds"
ON public.refunds
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.admin_type = 'master'::admin_type
  )
);

DROP POLICY IF EXISTS "Admins can manage refunds" ON public.refunds;
CREATE POLICY "Admins can manage refunds"
ON public.refunds
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all refunds" ON public.refunds;
CREATE POLICY "Admins can view all refunds"
ON public.refunds
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can request refunds" ON public.refunds;
CREATE POLICY "Users can request refunds"
ON public.refunds
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own refunds" ON public.refunds;
CREATE POLICY "Users can view their own refunds"
ON public.refunds
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- support_conversations
DROP POLICY IF EXISTS "Admins can update conversations" ON public.support_conversations;
CREATE POLICY "Admins can update conversations"
ON public.support_conversations
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own conversations" ON public.support_conversations;
CREATE POLICY "Users can create their own conversations"
ON public.support_conversations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.support_conversations;
CREATE POLICY "Users can view their own conversations"
ON public.support_conversations
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- support_messages
DROP POLICY IF EXISTS "Admins can update message read status" ON public.support_messages;
CREATE POLICY "Admins can update message read status"
ON public.support_messages
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = support_messages.conversation_id
      AND sc.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = support_messages.conversation_id
      AND sc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.support_messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.support_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = support_messages.conversation_id
      AND (
        (sc.user_id = auth.uid() AND support_messages.sender_type = 'user')
        OR (public.has_role(auth.uid(), 'admin'::app_role) AND support_messages.sender_type = 'admin')
      )
  )
);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.support_messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.support_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = support_messages.conversation_id
      AND (
        sc.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

-- token_purchases
DROP POLICY IF EXISTS "Admin master can delete token_purchases" ON public.token_purchases;
CREATE POLICY "Admin master can delete token_purchases"
ON public.token_purchases
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.admin_type = 'master'::admin_type
  )
);

DROP POLICY IF EXISTS "Admins can insert token_purchases" ON public.token_purchases;
CREATE POLICY "Admins can insert token_purchases"
ON public.token_purchases
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update token_purchases" ON public.token_purchases;
CREATE POLICY "Admins can update token_purchases"
ON public.token_purchases
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.token_purchases;
CREATE POLICY "Admins can view all purchases"
ON public.token_purchases
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own purchases" ON public.token_purchases;
CREATE POLICY "Users can view their own purchases"
ON public.token_purchases
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- token_transactions
DROP POLICY IF EXISTS "Admin master can delete token_transactions" ON public.token_transactions;
CREATE POLICY "Admin master can delete token_transactions"
ON public.token_transactions
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.admin_type = 'master'::admin_type
  )
);

DROP POLICY IF EXISTS "Admins can insert token_transactions" ON public.token_transactions;
CREATE POLICY "Admins can insert token_transactions"
ON public.token_transactions
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.token_transactions;
CREATE POLICY "Admins can view all transactions"
ON public.token_transactions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.token_transactions;
CREATE POLICY "Users can view their own transactions"
ON public.token_transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
