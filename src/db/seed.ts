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

    // Seed a test grantor organization
    const orgResult = await pool.query(`
      INSERT INTO grantor_organizations (org_name, org_type)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING org_id
    `, ['Example Federal Agency', 'federal_agency']);

    let orgId: string;
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].org_id;
    } else {
      // Org already exists, fetch it
      const existing = await pool.query(
        `SELECT org_id FROM grantor_organizations WHERE org_name = $1`,
        ['Example Federal Agency'],
      );
      orgId = existing.rows[0].org_id;
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

    console.log('Seed complete — admin@example.gov / TestPassword123!');
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
