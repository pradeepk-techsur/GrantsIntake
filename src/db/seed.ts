import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { env } from '../config/env';

async function seed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    console.log('Starting idempotent seed...');

    // Seed admin user (ON CONFLICT DO NOTHING for idempotency)
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);

    const userResult = await pool.query(`
      INSERT INTO users (email, full_name, password_hash, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active
      RETURNING user_id
    `, ['admin@example.gov', 'System Administrator', passwordHash]);

    const adminUserId = userResult.rows[0].user_id;
    console.log(`Admin user upserted: admin@example.gov (id: ${adminUserId})`);

    // Seed a test grantor organization (SELECT-then-INSERT — no UNIQUE constraint on org_name)
    const existingOrg = await pool.query(
      `SELECT org_id FROM grantor_organizations WHERE org_name = $1`,
      ['Example Federal Agency'],
    );

    let orgId: string;
    if (existingOrg.rows.length > 0) {
      orgId = existingOrg.rows[0].org_id;
    } else {
      const orgResult = await pool.query(
        `INSERT INTO grantor_organizations (org_name, org_type)
         VALUES ($1, $2)
         RETURNING org_id`,
        ['Example Federal Agency', 'federal_agency'],
      );
      orgId = orgResult.rows[0].org_id;
    }
    console.log(`Grantor organization upserted: Example Federal Agency (id: ${orgId})`);

    // Assign grantor_admin role to admin user for the org
    await pool.query(`
      INSERT INTO grantor_roles (grantor_org_id, user_id, roles)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (grantor_org_id, user_id) DO UPDATE SET
        roles = EXCLUDED.roles,
        revoked_at = NULL
    `, [orgId, adminUserId, JSON.stringify(['grantor_admin'])]);

    console.log(`Grantor role assigned: admin@example.gov → grantor_admin`);

    // Seed default program (idempotent — check before insert, no UNIQUE constraint on name)
    const existingProgram = await pool.query(
      `SELECT 1 FROM programs WHERE grantor_org_id = $1 AND program_name = $2`,
      [orgId, 'General Grant Programs'],
    );
    if (existingProgram.rows.length === 0) {
      await pool.query(
        `INSERT INTO programs
           (grantor_org_id, program_name, program_area, is_federal, program_description, created_by)
         VALUES ($1, $2, $3, TRUE, $4, $5)`,
        [
          orgId,
          'General Grant Programs',
          'General',
          'Default program for Example Federal Agency. Used for creating and managing funding opportunities.',
          adminUserId,
        ],
      );
    }
    console.log('Seeded default program: General Grant Programs (idempotent)');

    // Capture the General Grant Programs program_id for UAT opportunities
    const mainProgramResult = await pool.query(
      `SELECT program_id FROM programs WHERE grantor_org_id = $1 AND program_name = $2 LIMIT 1`,
      [orgId, 'General Grant Programs'],
    );
    const mainProgramId = mainProgramResult.rows[0]?.program_id;
    if (!mainProgramId) throw new Error('mainProgramId missing after upsert — General Grant Programs not found');

    // Seed 5 system opportunity templates (idempotent via ON CONFLICT DO NOTHING)
    const systemTemplates = [
      {
        template_name: 'Federal Notice of Funding Opportunity (NOFO)',
        template_type: 'federal_nofo',
        grant_market: 'federal',
        default_sections: JSON.stringify([
          'Program Description',
          'Federal Award Information',
          'Eligibility Information',
          'Application and Submission Information',
          'Application Review Information',
          'Federal Award Administration Information',
          'Federal Awarding Agency Contacts',
        ]),
        default_metadata: JSON.stringify({
          announcement_type: 'Initial',
          assistance_listing_number: null,
          opportunity_number: null,
          funding_instrument_type: 'Grant',
          category_of_funding_activity: null,
          estimated_total_program_funding: null,
          award_ceiling: null,
          award_floor: null,
          expected_number_of_awards: null,
          cost_sharing_or_matching_requirement: false,
        }),
      },
      {
        template_name: 'State / Local Government Grant',
        template_type: 'state_grant',
        grant_market: 'state_local',
        default_sections: JSON.stringify([
          'Program Overview',
          'Funding Information',
          'Eligibility Requirements',
          'Application Requirements',
          'Evaluation Criteria',
          'Award Administration',
          'Contact Information',
        ]),
        default_metadata: JSON.stringify({
          funding_source: 'State',
          award_type: 'Grant',
          cost_sharing_required: false,
          geographic_scope: null,
        }),
      },
      {
        template_name: 'Philanthropic Request for Proposals (RFP)',
        template_type: 'philanthropic_rfp',
        grant_market: 'philanthropic',
        default_sections: JSON.stringify([
          'Foundation Background',
          'Grant Focus Area',
          'Funding Priorities',
          'Eligibility',
          'Proposal Requirements',
          'Budget Guidelines',
          'Selection Process',
          'Reporting Requirements',
        ]),
        default_metadata: JSON.stringify({
          grant_type: 'Project Grant',
          multi_year_funding: false,
          indirect_cost_allowed: false,
          letter_of_inquiry_required: false,
        }),
      },
      {
        template_name: 'Corporate Grant Program',
        template_type: 'corporate_grant',
        grant_market: 'corporate',
        default_sections: JSON.stringify([
          'Program Description',
          'Alignment with Corporate Mission',
          'Eligibility',
          'Funding Guidelines',
          'Application Instructions',
          'Decision Timeline',
          'Reporting',
        ]),
        default_metadata: JSON.stringify({
          grant_type: 'Corporate Philanthropy',
          employee_involvement_required: false,
          in_kind_support_available: false,
          geographic_restrictions: null,
        }),
      },
      {
        template_name: 'Pass-Through Subaward',
        template_type: 'pass_through_subaward',
        grant_market: 'pass_through',
        default_sections: JSON.stringify([
          'Prime Award Information',
          'Subaward Scope of Work',
          'Eligibility Requirements',
          'Budget and Cost Principles',
          'Compliance Requirements',
          'Reporting Requirements',
          'Monitoring Plan',
        ]),
        default_metadata: JSON.stringify({
          prime_award_type: null,
          federal_flow_through: true,
          uei_required: true,
          sam_registration_required: true,
          indirect_cost_rate_required: true,
        }),
      },
    ];

    for (const template of systemTemplates) {
      // Check existence first, then insert if missing (idempotent)
      const existing = await pool.query(
        `SELECT 1 FROM opportunity_templates WHERE template_type = $1 AND is_system_template = TRUE`,
        [template.template_type],
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO opportunity_templates
             (template_name, template_type, grant_market, default_sections, default_metadata, is_system_template, owner_org_id, created_by)
           VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, TRUE, NULL, NULL)`,
          [
            template.template_name,
            template.template_type,
            template.grant_market,
            template.default_sections,
            template.default_metadata,
          ],
        );
      }
    }
    console.log('Seeded 5 system opportunity templates (idempotent)');

    // Seed guidance prompts for key narrative fields (idempotent via field_id UNIQUE)
    const guidancePrompts = [
      {
        field_id: 'executive_summary',
        prompt_text: 'Write a clear, plain-language overview of your funding opportunity. Describe the purpose of the grant, what you hope to achieve, and who should apply. Aim for a 6th-8th grade reading level.',
        example_text: 'The Community Health Innovation Grant supports non-profit organizations that develop new approaches to reducing childhood obesity in underserved communities. Awards of $50,000–$200,000 will fund 12-month projects that demonstrate measurable health outcomes.',
        uswds_tips: JSON.stringify([
          'Lead with the most important information (who, what, how much)',
          'Avoid jargon and acronyms — spell them out on first use',
          'Use active voice: "We will fund" not "Funding will be provided"',
        ]),
      },
      {
        field_id: 'eligibility_summary',
        prompt_text: 'Clearly describe who is eligible to apply. Include organization types, geographic requirements, and any prior experience or certification requirements. Be specific so applicants can self-screen.',
        example_text: 'Eligible applicants include 501(c)(3) non-profit organizations and local health departments located in rural communities with populations under 50,000. Applicants must have at least 2 years of experience delivering health programs and a current UEI number.',
        uswds_tips: JSON.stringify([
          'List eligibility criteria as a bulleted list for easy scanning',
          'Clearly state who is NOT eligible to reduce ineligible applications',
          'Include any registration requirements (SAM.gov, UEI, state registration)',
        ]),
      },
      {
        field_id: 'contact_name',
        prompt_text: 'Provide the name of the primary point of contact who can answer questions about this funding opportunity. This person should be available during the application period.',
        example_text: 'Dr. Maria Johnson, Program Officer',
        uswds_tips: JSON.stringify([
          'Include professional title or role after the name',
          'Ensure the contact person is available during the application period',
          'Consider providing a backup contact for high-volume opportunities',
        ]),
      },
      {
        field_id: 'contact_email',
        prompt_text: 'Provide an official government or organization email address for applicant questions. Avoid personal email addresses. Consider using a shared inbox for high-volume opportunities.',
        example_text: 'grants@example.gov',
        uswds_tips: JSON.stringify([
          'Use an official organizational email domain',
          'A shared inbox (grants@ or programs@) is better than individual email for high-volume opportunities',
          'Set up an auto-reply confirming receipt of questions',
        ]),
      },
      {
        field_id: 'program_area',
        prompt_text: 'Specify the primary program area or subject matter focus of this funding opportunity. This helps applicants find opportunities relevant to their work and supports reporting and categorization.',
        example_text: 'Public Health / Community Health Improvement',
        uswds_tips: JSON.stringify([
          'Use standard program area classifications from your agency or organization',
          'Be specific enough to be meaningful but broad enough to include all eligible projects',
          'Align with your organization\'s strategic plan categories when possible',
        ]),
      },
    ];

    for (const prompt of guidancePrompts) {
      const existingPrompt = await pool.query(
        `SELECT 1 FROM guidance_prompts WHERE field_id = $1`,
        [prompt.field_id],
      );
      if (existingPrompt.rows.length === 0) {
        await pool.query(
          `INSERT INTO guidance_prompts (field_id, prompt_text, example_text, uswds_tips)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [prompt.field_id, prompt.prompt_text, prompt.example_text, prompt.uswds_tips],
        );
      }
    }
    console.log('Seeded 5 guidance prompts (idempotent)');

    // Seed applicant test user for e2e tests (idempotent via ON CONFLICT)
    const applicantHash = await bcrypt.hash('TestPass123!', 12);
    const applicantResult = await pool.query(`
      INSERT INTO users (email, full_name, password_hash, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active
      RETURNING user_id
    `, ['applicant@example.com', 'Test Applicant', applicantHash]);
    const applicantUserId = applicantResult.rows[0].user_id;
    console.log('Applicant user upserted: applicant@example.com');

    // ── UAT Scenario Seed ────────────────────────────────────────────────────
    // Creates a complete UAT scenario so Playwright tests can exercise the full
    // UI paths without manual DB setup. All inserts are idempotent.
    // UAT opportunities are seeded under 'General Grant Programs' (admin@example.gov's org)
    // so they appear in OpportunitiesIndex which fetches /programs scoped to the admin's org.

    // 3. Published opportunity (under General Grant Programs — admin@example.gov's program)
    const existingUatOpportunity = await pool.query(
      `SELECT opportunity_id FROM opportunities WHERE opportunity_number = $1`,
      ['UAT-OPP-001'],
    );
    let uatOpportunityId: string;
    if (existingUatOpportunity.rows.length > 0) {
      uatOpportunityId = existingUatOpportunity.rows[0].opportunity_id;
      // Re-assign to correct program (idempotent migration of existing row)
      await pool.query(
        `UPDATE opportunities SET program_id = $1 WHERE opportunity_id = $2`,
        [mainProgramId, uatOpportunityId],
      );
    } else {
      const uatOpportunityResult = await pool.query(
        `INSERT INTO opportunities (
           program_id, title, funding_source, announcement_type, opportunity_number,
           eligibility_summary, executive_summary, contact_name, contact_email,
           program_area, funding_amount_max, status, created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING opportunity_id`,
        [
          mainProgramId,
          'UAT Community Health Innovation Grant',
          'Example Federal Agency',
          'Initial',
          'UAT-OPP-001',
          'Open to 501(c)(3) nonprofits in rural communities.',
          'Supports non-profit organizations developing health programs for rural communities.',
          'UAT Program Officer',
          'uat-officer@example.gov',
          'Public Health',
          200000.00,
          'published',
          adminUserId,
        ],
      );
      uatOpportunityId = uatOpportunityResult.rows[0].opportunity_id;
    }

    // Enable Q&A on UAT-OPP-001 so applicants can submit questions during UAT
    await pool.query(
      `UPDATE opportunities
       SET qa_config = '{"enabled": true}'::jsonb
       WHERE opportunity_id = $1 AND (qa_config IS NULL OR (qa_config->>'enabled')::boolean IS NOT TRUE)`,
      [uatOpportunityId],
    );
    console.log('Q&A enabled on UAT-OPP-001 (idempotent)');

    // 3b. Second published opportunity (UAT-OPP-002) — NO workspace seeded, enables Start Application UAT Test 2
    const existingUatOpportunity2 = await pool.query(
      `SELECT opportunity_id FROM opportunities WHERE opportunity_number = $1`,
      ['UAT-OPP-002'],
    );
    if (existingUatOpportunity2.rows.length === 0) {
      await pool.query(
        `INSERT INTO opportunities (
           program_id, title, funding_source, announcement_type, opportunity_number,
           eligibility_summary, executive_summary, contact_name, contact_email,
           program_area, funding_amount_max, status, created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          mainProgramId,
          'UAT Community Health Grant 2',
          'Example Federal Agency',
          'Initial',
          'UAT-OPP-002',
          'Open to 501(c)(3) nonprofits in urban communities.',
          'Supports non-profit organizations developing health programs for urban communities.',
          'UAT Program Officer',
          'uat-officer@example.gov',
          'Public Health',
          150000.00,
          'published',
          adminUserId,
        ],
      );
    } else {
      // Re-assign to correct program (idempotent migration of existing row)
      await pool.query(
        `UPDATE opportunities SET program_id = $1 WHERE opportunity_id = $2`,
        [mainProgramId, existingUatOpportunity2.rows[0].opportunity_id],
      );
    }
    console.log('Seeded UAT-OPP-002 under General Grant Programs (no workspace — enables Start Application flow) (idempotent)');

    // 4. Applicant organization for applicant@example.com
    const existingUatOrg = await pool.query(
      `SELECT org_id FROM organizations WHERE legal_name = $1`,
      ['UAT Test Nonprofit'],
    );
    let uatOrgId: string;
    if (existingUatOrg.rows.length > 0) {
      uatOrgId = existingUatOrg.rows[0].org_id;
    } else {
      const uatOrgResult = await pool.query(
        `INSERT INTO organizations (
           legal_name, address_line1, city, state, zip, entity_type,
           primary_contact_name, primary_contact_email, banking_readiness, profile_completeness_pct
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING org_id`,
        [
          'UAT Test Nonprofit',
          '100 Main Street',
          'Springfield',
          'IL',
          '62701',
          'nonprofit_501c3',
          'Test Applicant',
          'applicant@example.com',
          'ready',
          75,
        ],
      );
      uatOrgId = uatOrgResult.rows[0].org_id;
    }

    // 5. Org role — assign applicant@example.com as authorized_representative
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (org_id, user_id) DO NOTHING`,
      [uatOrgId, applicantUserId, JSON.stringify(['authorized_representative', 'proposal_lead'])],
    );

    // 6. UAT workspace for the applicant org + opportunity
    const existingUatWorkspace = await pool.query(
      `SELECT workspace_id FROM application_workspaces
       WHERE opportunity_id = $1 AND org_id = $2`,
      [uatOpportunityId, uatOrgId],
    );
    let uatWorkspaceId: string | null = null;
    if (existingUatWorkspace.rows.length > 0) {
      uatWorkspaceId = existingUatWorkspace.rows[0].workspace_id;
    } else {
      const uatWorkspaceResult = await pool.query(
        `INSERT INTO application_workspaces (opportunity_id, org_id, created_by)
         VALUES ($1, $2, $3)
         RETURNING workspace_id`,
        [uatOpportunityId, uatOrgId, applicantUserId],
      );
      uatWorkspaceId = uatWorkspaceResult.rows[0].workspace_id;
    }

    // 7. 9 workspace sections (idempotent — skip if section_type already exists for workspace)
    if (uatWorkspaceId) {
      const DEFAULT_SECTIONS = [
        { section_type: 'org_profile', section_name: 'Organization Profile', display_order: 1 },
        { section_type: 'eligibility', section_name: 'Eligibility', display_order: 2 },
        { section_type: 'narrative', section_name: 'Narrative', display_order: 3 },
        { section_type: 'budget', section_name: 'Budget', display_order: 4 },
        { section_type: 'workplan', section_name: 'Work Plan', display_order: 5 },
        { section_type: 'performance_measures', section_name: 'Performance Measures', display_order: 6 },
        { section_type: 'attachments', section_name: 'Attachments', display_order: 7 },
        { section_type: 'certifications', section_name: 'Certifications', display_order: 8 },
        { section_type: 'review_submit', section_name: 'Review & Submit', display_order: 9 },
      ];
      for (const section of DEFAULT_SECTIONS) {
        await pool.query(
          `INSERT INTO application_sections (workspace_id, section_type, section_name, display_order)
           SELECT $1::uuid, $2::varchar, $3::varchar, $4::int
           WHERE NOT EXISTS (
             SELECT 1 FROM application_sections
             WHERE workspace_id = $1::uuid AND section_type = $2::varchar
           )`,
          [uatWorkspaceId, section.section_type, section.section_name, section.display_order],
        );
      }
    }

    // 8. Form field definitions for narrative section (idempotent — use WHERE NOT EXISTS on label+section_id)
    if (uatWorkspaceId) {
      const narrativeSectionResult = await pool.query(
        `SELECT section_id FROM application_sections WHERE workspace_id = $1 AND section_type = 'narrative' LIMIT 1`,
        [uatWorkspaceId],
      );
      const narrativeSectionId = narrativeSectionResult.rows[0]?.section_id;

      if (narrativeSectionId && uatOpportunityId && applicantUserId) {
        const narrativeFields = [
          {
            field_type: 'textarea',
            label: 'Project Narrative',
            placeholder: 'Describe your project in detail…',
            help_text: 'Provide a comprehensive description of the project, its goals, and expected outcomes. Maximum 5,000 characters.',
            is_required: true,
            display_order: 1,
            validation_config: { max_chars: 5000 },
          },
          {
            field_type: 'textarea',
            label: 'Goals and Objectives',
            placeholder: 'List your specific, measurable goals…',
            help_text: 'Describe at least 3 measurable goals aligned with the opportunity priorities.',
            is_required: true,
            display_order: 2,
            validation_config: { max_chars: 2000 },
          },
          {
            field_type: 'number',
            label: 'Number of Beneficiaries',
            placeholder: '0',
            help_text: 'Estimated number of individuals who will directly benefit from this project.',
            is_required: false,
            display_order: 3,
            validation_config: { min: 0, max: 1000000 },
          },
        ];

        for (const field of narrativeFields) {
          await pool.query(
            `INSERT INTO form_field_definitions
               (opportunity_id, section_id, field_type, label, placeholder, help_text,
                is_required, display_order, validation_config, created_by)
             SELECT $1::uuid, $2::uuid, $3::varchar, $4::varchar, $5::varchar, $6::varchar,
                    $7::boolean, $8::int, $9::jsonb, $10::uuid
             WHERE NOT EXISTS (
               SELECT 1 FROM form_field_definitions
               WHERE section_id = $2::uuid AND label = $4::varchar
             )`,
            [
              uatOpportunityId,
              narrativeSectionId,
              field.field_type,
              field.label,
              field.placeholder,
              field.help_text,
              field.is_required,
              field.display_order,
              JSON.stringify(field.validation_config),
              applicantUserId,
            ],
          );
        }
        console.log('Seeded 3 form_field_definitions for UAT narrative section (idempotent)');
      }
    }

    // Seed form_field_definitions for remaining completable sections (idempotent)
    const SECTION_FIELDS: Record<string, Array<{
      field_type: string;
      label: string;
      placeholder: string;
      help_text: string;
      is_required: boolean;
      display_order: number;
      validation_config: object;
    }>> = {
      org_profile: [
        {
          field_type: 'text',
          label: 'Legal Organization Name',
          placeholder: 'Enter your organization\'s legal name…',
          help_text: 'As registered with your state or federal authority.',
          is_required: true,
          display_order: 1,
          validation_config: { max_chars: 200 },
        },
        {
          field_type: 'text',
          label: 'EIN / Tax ID Number',
          placeholder: 'XX-XXXXXXX',
          help_text: 'Your 9-digit Employer Identification Number.',
          is_required: true,
          display_order: 2,
          validation_config: { max_chars: 20 },
        },
      ],
      eligibility: [
        {
          field_type: 'textarea',
          label: 'Eligibility Self-Certification',
          placeholder: 'Confirm your organization meets the eligibility criteria…',
          help_text: 'Describe how your organization meets the eligibility requirements for this opportunity.',
          is_required: true,
          display_order: 1,
          validation_config: { max_chars: 2000 },
        },
      ],
      workplan: [
        {
          field_type: 'textarea',
          label: 'Project Timeline and Milestones',
          placeholder: 'Describe your implementation timeline…',
          help_text: 'Provide a timeline with key milestones, responsible parties, and expected completion dates.',
          is_required: true,
          display_order: 1,
          validation_config: { max_chars: 3000 },
        },
        {
          field_type: 'textarea',
          label: 'Key Personnel',
          placeholder: 'List key staff and their roles…',
          help_text: 'Identify the lead staff members who will implement the project.',
          is_required: false,
          display_order: 2,
          validation_config: { max_chars: 1000 },
        },
      ],
      performance_measures: [
        {
          field_type: 'textarea',
          label: 'Outcome Measures',
          placeholder: 'List measurable outcomes…',
          help_text: 'Describe the specific, measurable outcomes you will track throughout the project.',
          is_required: true,
          display_order: 1,
          validation_config: { max_chars: 2000 },
        },
        {
          field_type: 'number',
          label: 'Number of Direct Beneficiaries',
          placeholder: '0',
          help_text: 'Total number of individuals directly served by this project.',
          is_required: true,
          display_order: 2,
          validation_config: { min: 1, max: 10000000 },
        },
      ],
      review_submit: [
        {
          field_type: 'textarea',
          label: 'Application Certification Statement',
          placeholder: 'I certify that the information provided is accurate…',
          help_text: 'By completing this field you certify that all information in this application is accurate and complete to the best of your knowledge.',
          is_required: true,
          display_order: 1,
          validation_config: { max_chars: 500 },
        },
      ],
    };

    for (const [sectionType, fields] of Object.entries(SECTION_FIELDS)) {
      if (!uatWorkspaceId || !uatOpportunityId || !applicantUserId) continue;
      const sectionResult = await pool.query(
        `SELECT section_id FROM application_sections WHERE workspace_id = $1 AND section_type = $2 LIMIT 1`,
        [uatWorkspaceId, sectionType],
      );
      const sectionId = sectionResult.rows[0]?.section_id;
      if (!sectionId) continue;

      for (const field of fields) {
        await pool.query(
          `INSERT INTO form_field_definitions
             (opportunity_id, section_id, field_type, label, placeholder, help_text,
              is_required, display_order, validation_config, created_by)
           SELECT $1::uuid, $2::uuid, $3::varchar, $4::varchar, $5::varchar, $6::varchar,
                  $7::boolean, $8::int, $9::jsonb, $10::uuid
           WHERE NOT EXISTS (
             SELECT 1 FROM form_field_definitions
             WHERE section_id = $2::uuid AND label = $4::varchar
           )`,
          [
            uatOpportunityId,
            sectionId,
            field.field_type,
            field.label,
            field.placeholder,
            field.help_text,
            field.is_required,
            field.display_order,
            JSON.stringify(field.validation_config),
            applicantUserId,
          ],
        );
      }
      console.log(`Seeded form_field_definitions for ${sectionType} section (idempotent)`);
    }

    console.log('Seeded UAT scenario: UAT-OPP-001 + UAT-OPP-002 under General Grant Programs + UAT Test Nonprofit + workspace (idempotent)');
    // ── End UAT Scenario Seed ────────────────────────────────────────────────

    console.log('Seed complete — admin@example.gov / TestPassword123! | applicant@example.com / TestPass123!');
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
