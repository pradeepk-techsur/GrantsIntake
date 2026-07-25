-- Migration 005: Make funding_amount_max nullable
-- funding_amount_max is a builder field filled after opportunity creation,
-- not a creation prerequisite. Making it nullable allows the TemplateLibrary
-- to create a draft opportunity without a funding amount, which is then
-- filled in via the Opportunity Builder (consistent with updateOpportunitySchema).
ALTER TABLE opportunities ALTER COLUMN funding_amount_max DROP NOT NULL;
