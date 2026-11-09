# ISNESI Admin Panel
## Functional Requirements & Backend Architecture Specification

**Document status:** Foundational specification  
**Version:** 1.0  
**System:** ISNESI Public Website and Administration Panel  
**Primary purpose:** Define the requirements, data architecture, security controls, workflows and operational infrastructure needed to manage the complete public ISNESI website.

---

# 1. Product definition

## 1.1 Purpose

The ISNESI Admin Panel is the central management system for the public website. It must allow authorised staff to manage website content, programmes, stories, media, partners, enquiries, child referrals, donations, newsletters, educational resources, users, integrations and operational settings.

It must be a real content and operations management system—not simply a dashboard displaying information.

Every important action must connect to persistent backend data, enforce permissions and produce an appropriate audit record.

## 1.2 Core principles

1. **Centralised management:** All public-facing website content should be manageable through the administration panel.
2. **Least privilege:** Users receive only the access necessary for their responsibilities.
3. **Child safeguarding first:** Sensitive child and family information must be isolated from ordinary enquiries and public content.
4. **Editorial accountability:** Content changes, approvals and publication must be traceable.
5. **Data protection:** Personal information must be collected, stored, accessed and retained responsibly.
6. **Operational reliability:** Payments, email, notifications and backups must have clear failure and recovery procedures.
7. **Accessibility:** Both the administration panel and public website should support inclusive use.
8. **Maintainability:** The architecture should support additional programmes, languages, content types and integrations without requiring a complete rebuild.

## 1.3 System boundaries

The system consists of:

- Public ISNESI website.
- Secure administration panel.
- Application backend/API.
- Relational database.
- Private file and media storage.
- Authentication and authorisation service.
- Payment gateway integrations.
- Email and newsletter integrations.
- Notification service.
- Audit and monitoring services.
- Backup and recovery infrastructure.

The payment provider remains responsible for payment processing. The ISNESI system stores transaction references and financial records, not payment card credentials or mobile money PINs.

The newsletter provider remains responsible for email campaign delivery. ISNESI maintains the subscriber, consent and campaign-management records needed to operate that integration.

---

# 2. Complete admin-panel functional requirements

## 2.1 Dashboard

The dashboard must provide an operational overview of the entire website.

### Required capabilities

- Total published pages.
- Draft and pending-review content.
- Scheduled publications.
- Published programmes.
- Open enquiries.
- Unassigned enquiries.
- Restricted referral workload indicators.
- Donation totals and reconciliation status.
- Newsletter subscriber totals.
- Recent content activity.
- Recent administrative activity.
- Pending approvals.
- Integration health.
- Backup status.
- Security alerts.
- Launch-readiness warnings.

### Dashboard controls

- Date-range filters.
- Quick links to management modules.
- Recent activity filters.
- Exportable operational reports.
- Role-specific dashboard views.

**Security requirement:** General dashboard users must not see child names, referral descriptions, medical details or other sensitive case information. Safeguarding workload indicators should be aggregated.

## 2.2 Pages and sections

The CMS must manage all public website pages and their individual sections.

### Management requirements

- Create, edit, duplicate and archive pages.
- Create reusable page sections.
- Reorder sections.
- Enable and disable sections.
- Manage headings, paragraphs, buttons and links.
- Manage hero sections and banners.
- Manage images and embedded media.
- Configure page-specific metadata.
- Manage SEO titles and descriptions.
- Configure canonical URLs.
- Configure social-sharing images.
- Preview desktop, tablet and mobile layouts.
- Maintain draft and published versions.
- Schedule publication.
- Restore earlier versions.

### Page types

- Standard page.
- Landing page.
- Programme page.
- Editorial index.
- Editorial detail.
- Campaign page.
- Legal and policy page.
- Resource page.
- Custom reusable page.

### Initial pages

The initial content structure should cover:

- Home.
- About ISNESI.
- Our Work.
- Impact.
- Kids' Corner.
- Stories.
- News.
- Get Involved.
- Donate.
- Partners.
- Newsletter.
- Contact.
- Terms and conditions.
- Privacy policy.
- Safeguarding policy.
- Cookie policy.
- Accessibility statement.

The page list must be editable. These must not be permanently hardcoded into the application.

## 2.3 Programmes

Administrators must be able to manage the programme areas displayed on the public website.

Initial programme records:

1. Inclusive Education.
2. Special Needs Support.
3. Social Innovation.
4. Capacity Building.
5. Advocacy & Awareness.
6. Partnerships.

### Programme fields

- Programme name.
- Slug.
- Short description.
- Full description.
- Featured image.
- Icon.
- Objectives.
- Activities.
- Target beneficiaries.
- Geographic coverage.
- Related stories.
- Related resources.
- Related impact indicators.
- Display order.
- Visibility.
- Publication status.
- SEO metadata.

### Actions

- Create.
- Edit.
- Duplicate.
- Publish.
- Unpublish.
- Archive.
- Restore.
- Reorder.

Programme deletion should be restricted where associated content or historical reporting exists.

## 2.4 Stories and news

The editorial module must manage:

- Stories.
- News articles.
- Announcements.
- Events and activity reports.
- Impact stories.
- Community updates.
- Educational articles.

### Content fields

- Title.
- Slug.
- Summary.
- Body.
- Content type.
- Category.
- Tags.
- Featured image.
- Media gallery.
- Author.
- Editor.
- Reviewer.
- Publication date.
- Scheduled date.
- SEO metadata.
- Language.
- Consent and rights references.
- Safeguarding clearance where applicable.
- Related programmes.
- Related content.
- Publication status.

### Required editorial capabilities

- Rich-text editing.
- Draft saving.
- Autosave.
- Preview.
- Editorial assignment.
- Review requests.
- Approval and rejection.
- Scheduled publishing.
- Unpublishing.
- Revision comparison.
- Version restoration.
- Content archiving.
- Content takedown.
- Related-content management.

### Special child-related publishing safeguards

Where a story contains identifiable children:

- The editor must identify that the content requires safeguarding review.
- Required consent and image-rights evidence must be recorded.
- The safeguarding reviewer must approve publication.
- Restricted referral information must never be copied into the public article.
- The public article must not expose confidential case details.
- Publication must be blocked if mandatory clearance is incomplete.

## 2.5 Media library

### Supported assets

- Images.
- Documents.
- Logos.
- PDFs.
- Videos or video links.
- Illustrations.
- Downloadable educational resources.

### Required media fields

- Original filename.
- Stored filename.
- Storage location.
- MIME type.
- File size.
- Dimensions.
- Alt text.
- Caption.
- Description.
- Photographer or creator.
- Source.
- Licence.
- Rights status.
- Consent reference.
- Safeguarding review status.
- Uploaded by.
- Upload date.
- Usage references.
- Retention classification.

### Capabilities

- Upload.
- Bulk upload.
- Search.
- Filter.
- Preview.
- Replace asset.
- Generate optimised image variants.
- Manage alt text.
- Manage rights.
- View where an asset is used.
- Restrict sensitive assets.
- Archive.
- Delete according to retention rules.

Sensitive documents and referral attachments must not be stored in the publicly accessible media library.

## 2.6 Partners

Manage partner organisations and their public representation.

### Fields

- Organisation name.
- Description.
- Logo.
- Website.
- Contact information.
- Relationship type.
- Programme association.
- Agreement reference.
- Approval evidence.
- Approval date.
- Visibility.
- Display order.
- Status.

### Workflow

Partner record created → details verified → representation approved → published.

A partner's logo or name must not be presented as an endorsement without appropriate approval.

## 2.7 Navigation and footer

Administrators must manage:

- Header navigation.
- Dropdown menus.
- Footer navigation.
- External links.
- CTA buttons.
- Menu labels.
- Display order.
- Visibility.
- Link destinations.
- Social links.
- Footer tagline.
- Copyright notice.
- Contact information.

Navigation items must reference actual pages or validated external URLs.

The system must prevent broken internal links when a page is archived or its slug changes.

## 2.8 Enquiries and referrals

This module must support ordinary website enquiries while keeping child referrals in a separate secure system.

### Ordinary enquiry types

- General enquiry.
- Volunteer application.
- Partnership enquiry.
- Media enquiry.
- Feedback.
- Other contact submissions.

### Ordinary enquiry fields

- Reference number.
- Name.
- Email.
- Phone.
- Enquiry type.
- Message.
- Submission date.
- Consent record.
- Assigned staff member.
- Status.
- Internal notes.
- Response history.
- Closure date.

### Enquiry statuses

- New.
- Assigned.
- In progress.
- Awaiting response.
- Resolved.
- Closed.
- Archived.

### Capabilities

- Search.
- Filter.
- Assign.
- Reassign.
- Add internal notes.
- Respond.
- Escalate.
- Close.
- Reopen.
- Export permitted records.
- Review response history.

Child referrals must not be included in general enquiry exports.

## 2.9 Donations

### Management capabilities

- Configure suggested donation amounts.
- Configure minimum donation.
- Enable or disable recurring donations.
- Configure available payment methods.
- Manage campaign designations.
- View donation transactions.
- View payment status.
- Reconcile transactions.
- Issue receipts.
- Record refunds.
- Generate financial reports.
- Export authorised financial records.

### Donation fields

- Internal donation ID.
- Public donation reference.
- Donor name, if supplied.
- Donor email, if supplied.
- Amount.
- Currency.
- Payment method.
- Provider.
- Provider transaction reference.
- Campaign designation.
- Transaction status.
- Payment timestamp.
- Receipt number.
- Refund reference.
- Reconciliation status.

### Financial controls

- Never store card numbers, CVV values, mobile money PINs or wallet passwords.
- Verify provider webhooks.
- Prevent duplicate transaction processing.
- Separate payment initiation from confirmed payment.
- Restrict refunds to authorised finance users.
- Record who performed financial adjustments.
- Preserve transaction history.
- Reconcile gateway settlements against internal records.

## 2.10 Newsletter

### Management capabilities

- Subscriber management.
- Subscriber import.
- Consent tracking.
- Subscription confirmation.
- Unsubscribe handling.
- Suppression lists.
- Audience segmentation.
- Campaign creation.
- Campaign editing.
- Campaign preview.
- Test sending.
- Campaign approval.
- Campaign scheduling.
- Delivery reporting.

### Subscriber information

- Email address.
- Optional name.
- Subscription status.
- Consent source.
- Consent timestamp.
- Consent text/version.
- Confirmation timestamp.
- Unsubscribe timestamp.
- Provider contact reference.

### Rules

- Do not send marketing emails to unsubscribed contacts.
- Imported contacts without valid consent evidence must not automatically become active subscribers.
- Unsubscribe requests must be processed promptly.
- Preserve the minimum suppression record needed to prevent accidental resubscription.
- Keep transactional notifications separate from marketing campaigns.

## 2.11 Kids' Corner

Manage child-facing public resources.

### Supported resource types

- Stories.
- Learning activities.
- Worksheets.
- Videos.
- Games.
- Quizzes.
- Downloadable resources.
- Accessibility resources.

### Fields

- Title.
- Description.
- Resource type.
- Age range.
- Programme association.
- Learning objective.
- Media.
- Accessibility information.
- Language.
- Publication status.
- Safeguarding review.
- Reviewer.
- Publication date.

### Mandatory safeguards

- No public comments.
- No direct messaging between visitors and children.
- No unnecessary collection of child information.
- No behavioural advertising or profiling.
- Age-appropriate content review.
- Accessibility review.
- Safeguarding approval before publication where required.

## 2.12 Users and permissions

The system must support:

- User invitations.
- Account activation.
- Role assignment.
- Permission management.
- Role changes.
- Account suspension.
- Account deactivation.
- Session revocation.
- MFA enforcement.
- Login history.
- Password reset.
- Access review.

## 2.13 Site settings

Manage:

- Organisation name.
- Full organisation name.
- Tagline.
- Logo.
- Brand colours.
- Fonts.
- Contact email.
- Official phone.
- Approved office address.
- WhatsApp link.
- Social links.
- SEO defaults.
- Analytics integration.
- Email integration.
- Payment integration.
- Spam protection.
- Cookie settings.
- Maintenance mode.
- Public-site availability.

Secrets and API keys must be stored in a secure secrets manager, not in editable website settings or ordinary database fields.

## 2.14 Accessibility

Manage public accessibility options and editorial checks.

Requirements:

- Alternative text.
- Keyboard accessibility.
- Visible focus states.
- Skip navigation.
- Colour contrast.
- Reduced motion support.
- Captions and transcripts.
- Form labels.
- Accessible heading hierarchy.
- Responsive layouts.
- Accessibility review records.

The target should be WCAG 2.2 AA, with manual testing in addition to automated checks.

## 2.15 Audit log

Record:

- Successful and failed logins.
- Account changes.
- Role changes.
- Permission changes.
- Content creation.
- Content editing.
- Content approval.
- Publication.
- Unpublication.
- Deletion.
- Sensitive record access.
- File downloads.
- Exports.
- Consent changes.
- Payment actions.
- Refunds.
- Integration changes.
- Backup and restore operations.

---

# 3. Database architecture

## 3.1 Recommended database model

Use a relational database with PostgreSQL-compatible features.

The schema should be organised into logical domains:

| Domain | Purpose |
|---|---|
| Identity | Users, roles, permissions and sessions |
| CMS | Pages, sections, programmes and navigation |
| Editorial | Stories, news, revisions and approvals |
| Media | Assets, files, rights and consent references |
| Relationships | Partners, categories, tags and related content |
| Engagement | Ordinary enquiries and response history |
| Safeguarding | Restricted referrals and case records |
| Finance | Donations, transactions, receipts and refunds |
| Communications | Subscribers, consent and campaigns |
| Kids' Corner | Child-facing resources and reviews |
| Configuration | Site settings and integrations |
| Operations | Audit logs, notifications and backups |

Use UUID primary keys, UTC timestamps and foreign-key constraints.

The organisation's public-facing currency may be XAF, but financial tables must retain an explicit currency code rather than assume every future transaction uses one currency.

## 3.2 Identity and RBAC tables

### `users`

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| auth_user_id | UUID | External authentication identity |
| full_name | VARCHAR | Staff name |
| email | VARCHAR | Unique |
| phone | VARCHAR | Optional |
| status | VARCHAR | Invited, active, suspended, disabled |
| mfa_enforced | BOOLEAN | Privileged account requirement |
| last_login_at | TIMESTAMPTZ | Last successful login |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

### `roles`

- id
- name
- description
- is_system_role
- created_at

### `permissions`

- id
- code
- module
- action
- description

Example permission codes:

- `pages.read`
- `pages.create`
- `pages.edit`
- `pages.publish`
- `stories.approve`
- `media.upload`
- `enquiries.assign`
- `referrals.read`
- `referrals.assign`
- `referrals.export`
- `donations.read`
- `donations.refund`
- `users.manage`
- `audit.read`
- `settings.manage`

### `user_roles`

- user_id
- role_id
- assigned_by
- assigned_at
- expires_at

### `role_permissions`

- role_id
- permission_id
- created_at

### `user_permission_overrides`

- id
- user_id
- permission_id
- effect
- reason
- granted_by
- expires_at

Overrides must be exceptional, justified and audited.

## 3.3 CMS tables

### `pages`

- id
- title
- slug
- page_type
- summary
- status
- featured_image_id
- seo_title
- seo_description
- canonical_url
- created_by
- updated_by
- published_at
- created_at
- updated_at
- archived_at

Unique constraint: `(slug)` for the active URL namespace.

### `page_sections`

- id
- page_id
- section_type
- title
- content_json
- display_order
- is_visible
- created_at
- updated_at

`content_json` should hold validated structured content for the section type, not arbitrary executable HTML or scripts.

### `page_revisions`

- id
- page_id
- revision_number
- snapshot_json
- change_summary
- created_by
- created_at

### `programmes`

- id
- name
- slug
- short_description
- full_description
- icon
- featured_image_id
- objectives_json
- activities_json
- target_beneficiaries
- geographic_coverage
- display_order
- status
- created_by
- updated_by
- published_at
- created_at
- updated_at

### `programme_translations`

- id
- programme_id
- language_code
- translated_name
- short_description
- full_description
- translation_status
- updated_at

### `navigation_menus`

- id
- name
- location
- status
- updated_by
- updated_at

### `navigation_items`

- id
- menu_id
- parent_id
- page_id
- label
- external_url
- target
- display_order
- is_visible

### `site_settings`

- id
- setting_key
- setting_value_json
- setting_group
- is_public
- updated_by
- updated_at

Do not store credentials or private keys in `setting_value_json`.

## 3.4 Editorial tables

### `content_items`

- id
- title
- slug
- content_type
- summary
- body_json
- status
- author_id
- editor_id
- featured_image_id
- programme_id
- language_code
- requires_safeguarding_review
- published_at
- scheduled_at
- created_at
- updated_at
- archived_at

### `content_categories`

- id
- name
- slug
- description
- parent_id

### `content_tags`

- id
- name
- slug

### `content_item_categories`

- content_item_id
- category_id

### `content_item_tags`

- content_item_id
- tag_id

### `content_revisions`

- id
- content_item_id
- revision_number
- snapshot_json
- change_summary
- created_by
- created_at

### `content_approvals`

- id
- content_item_id
- revision_id
- approval_type
- reviewer_id
- decision
- comments
- decided_at

### `content_publication_events`

- id
- content_item_id
- revision_id
- action
- scheduled_for
- executed_at
- executed_by
- result

### `content_relationships`

- id
- source_content_id
- target_content_id
- relationship_type

### `content_consent_references`

- id
- content_item_id
- consent_record_id
- purpose
- verified_by
- verified_at

Consent evidence must be stored separately from the public article body.

## 3.5 Media tables

### `media_assets`

- id
- original_filename
- storage_key
- mime_type
- file_size
- width
- height
- alt_text
- caption
- description
- creator_name
- source
- rights_status
- licence
- uploaded_by
- visibility
- created_at
- archived_at

### `media_usage`

- id
- media_asset_id
- entity_type
- entity_id
- usage_type

### `media_rights_records`

- id
- media_asset_id
- rights_holder
- permission_type
- evidence_reference
- valid_from
- valid_until
- restrictions
- verified_by
- verified_at

### `consent_records`

- id
- subject_reference
- consent_type
- purpose
- consent_version
- evidence_storage_key
- status
- collected_by
- collected_at
- expires_at
- revoked_at
- verified_by
- verified_at

Restrict access to consent evidence. Public media records should expose only the rights metadata needed by authorised editors.

## 3.6 Partner tables

### `partners`

- id
- organisation_name
- slug
- description
- website
- logo_asset_id
- relationship_type
- status
- is_public
- display_order
- created_by
- updated_at

### `partner_approvals`

- id
- partner_id
- approval_reference
- approved_representation
- approved_by
- approved_at
- expires_at
- status

## 3.7 Ordinary enquiry tables

### `enquiries`

- id
- reference_number
- enquiry_type
- full_name
- email
- phone
- message
- status
- assigned_to
- consent_record_id
- received_at
- closed_at
- created_at
- updated_at

### `enquiry_notes`

- id
- enquiry_id
- note
- created_by
- created_at

### `enquiry_messages`

- id
- enquiry_id
- direction
- channel
- message_reference
- delivery_status
- sent_by
- sent_at

### `enquiry_assignments`

- id
- enquiry_id
- assigned_from
- assigned_to
- reason
- assigned_by
- assigned_at

Ordinary enquiry records must not contain confidential child case notes or medical documents.

## 3.8 Restricted safeguarding database domain

This is a separate security domain, not an ordinary extension of `enquiries`.

### `safeguarding_cases`

- id
- case_reference
- status
- priority
- assigned_officer_id
- referral_source
- received_at
- last_reviewed_at
- closed_at
- retention_class
- created_at
- updated_at

### `safeguarding_subjects`

- id
- case_id
- subject_reference
- encrypted_identity_data
- encrypted_contact_data
- relationship_to_case
- created_at

### `safeguarding_assessments`

- id
- case_id
- encrypted_assessment_data
- assessment_type
- assessed_by
- assessed_at
- review_due_at

### `safeguarding_case_notes`

- id
- case_id
- encrypted_note
- note_type
- created_by
- created_at
- amended_at

### `safeguarding_attachments`

- id
- case_id
- private_storage_key
- original_filename
- mime_type
- file_size
- uploaded_by
- classification
- created_at

### `safeguarding_assignments`

- id
- case_id
- assigned_from
- assigned_to
- assigned_by
- reason
- assigned_at

### `safeguarding_access_events`

- id
- case_id
- user_id
- action
- reason
- occurred_at
- request_id

### `safeguarding_consents`

- id
- case_id
- consent_type
- status
- evidence_reference
- collected_by
- collected_at
- reviewed_by

### `safeguarding_referral_sources`

- id
- case_id
- source_type
- source_reference
- received_at

The system must not put sensitive case details into general-purpose audit descriptions, notifications, application logs or analytics events.

Where appropriate, use application-level encryption and separate encryption keys for especially sensitive fields. Database encryption at rest alone is not sufficient protection.

## 3.9 Donation and payment tables

### `donation_campaigns`

- id
- name
- description
- target_amount
- currency
- starts_at
- ends_at
- status

### `donations`

- id
- public_reference
- campaign_id
- donor_name
- donor_email
- amount
- currency
- payment_method
- provider_id
- provider_transaction_reference
- status
- paid_at
- created_at

### `payment_providers`

- id
- provider_name
- provider_account_reference
- environment
- status
- configuration_reference
- created_at
- updated_at

Secret credentials must remain outside the database in a secrets manager.

### `payment_events`

- id
- provider_id
- provider_event_id
- donation_id
- event_type
- signature_verified
- processing_status
- received_at
- processed_at

Unique constraint: `(provider_id, provider_event_id)`.

### `donation_receipts`

- id
- donation_id
- receipt_number
- issued_at
- document_storage_key
- status

### `donation_refunds`

- id
- donation_id
- provider_refund_reference
- amount
- reason
- requested_by
- approved_by
- status
- created_at
- completed_at

### `donation_reconciliations`

- id
- provider_id
- settlement_reference
- settlement_date
- expected_amount
- received_amount
- currency
- status
- reconciled_by
- reconciled_at

## 3.10 Newsletter and notification tables

### `newsletter_subscribers`

- id
- email
- full_name
- status
- provider_contact_reference
- subscribed_at
- confirmed_at
- unsubscribed_at
- created_at
- updated_at

### `newsletter_consents`

- id
- subscriber_id
- consent_source
- consent_text_version
- consent_status
- recorded_at
- revoked_at
- evidence_reference

### `newsletter_segments`

- id
- name
- description
- status

### `newsletter_segment_members`

- subscriber_id
- segment_id
- added_at

### `newsletter_campaigns`

- id
- name
- subject
- template_reference
- content_json
- status
- scheduled_at
- approved_by
- approved_at
- provider_campaign_reference
- sent_at
- created_by
- created_at

### `newsletter_events`

- id
- campaign_id
- subscriber_id
- event_type
- provider_event_reference
- occurred_at

### `notification_templates`

- id
- template_key
- channel
- language_code
- subject
- body_template
- status

### `notifications`

- id
- recipient_user_id
- notification_type
- channel
- template_id
- related_entity_type
- related_entity_id
- delivery_status
- sent_at
- created_at

### `notification_delivery_attempts`

- id
- notification_id
- provider_reference
- attempt_number
- result
- error_code
- attempted_at

Sensitive case content must never be included in ordinary email or push notifications. A notification should direct an authorised staff member to the secure application.

## 3.11 Kids' Corner tables

### `kids_resources`

- id
- title
- slug
- description
- resource_type
- minimum_age
- maximum_age
- language_code
- learning_objective
- content_json
- featured_media_id
- status
- safeguarding_review_required
- created_by
- published_at
- created_at
- updated_at

### `kids_resource_reviews`

- id
- resource_id
- reviewer_id
- review_type
- decision
- comments
- reviewed_at

### `kids_resource_media`

- resource_id
- media_asset_id
- display_order

## 3.12 Audit and operations tables

### `audit_logs`

- id
- actor_user_id
- action
- module
- entity_type
- entity_id
- before_hash
- after_hash
- request_id
- ip_address
- user_agent
- result
- occurred_at

Avoid copying sensitive before-and-after values into audit records. Use identifiers, event types and cryptographic hashes where appropriate.

### `security_events`

- id
- user_id
- event_type
- risk_level
- source_ip
- user_agent
- details_redacted_json
- occurred_at

### `integration_events`

- id
- integration_type
- external_event_reference
- event_type
- processing_status
- retry_count
- last_error_code
- received_at
- processed_at

### `backup_records`

- id
- backup_type
- storage_reference
- started_at
- completed_at
- status
- checksum
- size_bytes
- verification_status
- retention_until

### `data_deletion_requests`

- id
- requester_reference
- request_type
- status
- received_at
- reviewed_by
- decision_at
- completion_at
- outcome_reference

---

# 4. Role-based access control

## 4.1 Standard roles

The following roles should be created initially.

| Role | Primary responsibility |
|---|---|
| Super Administrator | Overall system administration |
| Website Administrator | Public website configuration and operations |
| Content Editor | Pages, stories, news and editorial content |
| Content Contributor | Create and edit assigned drafts |
| Communications Officer | Enquiries, newsletters and communications |
| Finance Officer | Donations, receipts and reconciliation |
| Safeguarding Officer | Restricted referrals and safeguarding cases |
| Safeguarding Lead | Case oversight and safeguarding approval |
| Media Manager | Media assets and rights management |
| Programme Manager | Programme information and related content |
| Auditor / Compliance Reviewer | Read-only oversight and audit review |

Role assignments must be configurable without changing application code.

## 4.2 Permission matrix

Legend:

- **Full:** Create, read, update and permitted administrative actions.
- **Manage:** Manage assigned records and workflows.
- **Create/Edit:** Create and edit drafts.
- **Approve:** Approve specific workflow stages.
- **Read:** Read-only access.
- **Restricted:** Only explicitly authorised records.
- **None:** No access.

| Module | Super Admin | Website Admin | Editor | Contributor | Finance | Safeguarding | Communications | Auditor |
|---|---|---|---|---|---|---|---|---|
| Dashboard | Full | Full | Read | Read | Read | Restricted | Read | Read |
| Pages | Full | Full | Manage | Create/Edit | None | None | None | Read |
| Programmes | Full | Full | Manage | Create/Edit | None | None | None | Read |
| Stories/news | Full | Full | Manage/Approve | Create/Edit | None | Safeguarding approval only | Read | Read |
| Media | Full | Full | Manage | Assigned uploads | None | Restricted | Read | Read |
| Partners | Full | Full | Manage | Create/Edit | None | None | Manage | Read |
| Navigation | Full | Full | Read | None | None | None | None | Read |
| Enquiries | Full | Manage | None | None | None | None | Manage | Restricted |
| Child referrals | Emergency access only | None | None | None | None | Restricted | None | Restricted metadata |
| Donations | Full | Read | None | None | Manage | None | None | Read |
| Newsletter | Full | Manage | Read | None | None | None | Manage | Read |
| Kids' Corner | Full | Full | Manage | Create/Edit | None | Safeguarding approval | Read | Read |
| Users | Full | Limited | None | None | None | None | None | Read |
| Settings | Full | Manage | None | None | None | None | None | Read |
| Audit logs | Full | Read | None | None | Finance events | Safeguarding events | None | Read |
| Backups | Full | Operational status | None | None | None | None | None | Read metadata |

**Important:** A Super Administrator's emergency access to restricted cases must be exceptional, justified and audited. Ordinary administrative access should not automatically expose safeguarding case contents.

## 4.3 Permission enforcement

Permissions must be enforced at multiple levels:

1. Frontend interface.
2. Backend API.
3. Database policies or equivalent data-access controls.
4. Private file storage.
5. Export and reporting operations.

Hiding a button is not a security control.

The backend must verify every operation, including requests made directly through APIs.

### Record-level restrictions

The system must support:

- Assigned-record access.
- Department-based access.
- Restricted case assignment.
- Time-limited access grants.
- Approval requirements for sensitive exports.
- Emergency access with justification.
- Automatic revocation when a user is deactivated.

### Authentication requirements

- MFA for privileged users.
- Secure password reset.
- Invitation expiry.
- Session revocation.
- Rate limiting.
- Login throttling.
- Secure cookie/session configuration.
- Protection against account enumeration.
- No shared staff accounts.

---

# 5. Secure child referral and sensitive-information workflows

## 5.1 Fundamental separation

There must be two distinct workflows:

**Ordinary enquiries:** General public contact, volunteering, partnerships and feedback.

**Safeguarding referrals:** Child protection, sensitive family circumstances, disability-related assessments and other confidential case information.

A referral must never become visible merely because a user has permission to manage ordinary enquiries.

## 5.2 Public referral submission

### Step 1: Secure submission

The public referral form should:

- Explain why information is being collected.
- Explain who may access it.
- Collect only necessary information.
- Provide a safe contact method.
- Include an appropriate privacy notice.
- Support secure file uploads where required.
- Apply spam and abuse protection.
- Use encrypted transport.

Do not require a child to provide unnecessary personal information.

### Step 2: Reference generation

After submission:

- Generate a non-guessable case reference.
- Store the referral in the restricted safeguarding domain.
- Record submission time.
- Record the submission channel.
- Record consent and notice versions where applicable.
- Send a neutral confirmation without repeating sensitive details.

### Step 3: Triage

Only authorised safeguarding staff can:

- Open the full referral.
- Assess urgency.
- Assign responsibility.
- Record an assessment.
- Escalate a case.
- Record an action plan.

### Step 4: Case management

The case-management workspace must support:

- Case status.
- Priority.
- Assigned officer.
- Review date.
- Secure notes.
- Secure attachments.
- Assessment history.
- Contact history.
- Escalation history.
- Closure reason.
- Follow-up requirements.

### Step 5: Closure

A case can only be closed by an authorised safeguarding role.

The system must require:

- Closure reason.
- Completion status.
- Outstanding-action review.
- Retention classification.
- Closing officer.
- Closure timestamp.

## 5.3 Referral status model

Recommended states:

1. Received.
2. Awaiting triage.
3. Under assessment.
4. Assigned.
5. Action required.
6. Referred to an authorised external service.
7. Monitoring.
8. Resolved.
9. Closed.
10. Restricted archive.

Transitions must be controlled. For example, a newly received referral cannot be marked resolved without an assessment or documented rationale.

## 5.4 Sensitive-data protection

Mandatory controls:

- Private storage buckets.
- Encryption in transit.
- Encryption at rest.
- Application-level encryption for particularly sensitive fields.
- Separate encryption-key management.
- Strict record-level access.
- No public URLs for attachments.
- Short-lived signed download URLs.
- No referral content in analytics.
- No referral content in general notifications.
- No referral content in ordinary exports.
- Access logging.
- Export restrictions.
- Retention and deletion procedures.

### Access monitoring

Log:

- Who opened a case.
- When it was opened.
- Which record was accessed.
- Whether an attachment was downloaded.
- Whether information was changed.
- Whether a case was reassigned.
- Whether information was exported.
- Why emergency access was used.

## 5.5 Emergency access

A controlled emergency-access process may be provided to a designated administrator.

It must require:

- A specific justification.
- Strong authentication.
- A time-limited permission grant.
- Immediate audit logging.
- Notification to the safeguarding lead.
- Post-event review.

Emergency access must not become a permanent permission.

## 5.6 Retention and deletion

Create a documented retention schedule for:

- Ordinary enquiries.
- Child referrals.
- Safeguarding assessments.
- Consent evidence.
- Uploaded attachments.
- Financial records.
- Newsletter records.
- Audit records.

Retention periods must be approved through an appropriate safeguarding, privacy and legal review. They should not be invented in application code.

Deletion must account for:

- Primary database records.
- Attachments.
- Backups.
- Search indexes.
- Provider copies.
- Exported files.

Where deletion is not appropriate or legally permitted, the system must support restricted archival and documented retention.

---

# 6. Content publishing, approval and revision history

## 6.1 Editorial workflow

Recommended publication states:

`Draft → Submitted for Review → In Review → Changes Requested → Approved → Scheduled → Published → Archived`

A rejected item may return to Draft.

### Draft

- Author creates content.
- Autosave stores changes.
- Revisions are created.
- Content remains private.

### Submitted for review

- Author submits a specific revision.
- Reviewer is assigned.
- Submission timestamp is recorded.
- Further edits should create a new revision.

### In review

- Reviewer examines the submitted revision.
- Reviewer can approve or request changes.
- Review comments are stored separately from public content.

### Approved

- The approved revision becomes eligible for scheduling or publishing.
- Changes after approval invalidate the approval where they materially alter the approved content.

### Scheduled

- Publication time is stored in UTC.
- A background job publishes the approved revision.
- Failed publication attempts are logged and retried safely.

### Published

- Public website displays the approved revision.
- Publication timestamp and publishing actor are recorded.

### Archived

- Content is removed from normal public navigation.
- Historical revisions remain available to authorised users.

## 6.2 Separation of duties

Where practical:

- Contributors create drafts.
- Editors review content.
- A designated approver approves publication.
- The system records the author and approver separately.

For high-risk content involving identifiable children, safeguarding clearance is an additional mandatory approval—not a substitute for editorial approval.

## 6.3 Revision history

Every material change must create a revision.

Revision records must include:

- Revision number.
- Content identifier.
- Complete content snapshot.
- Author.
- Timestamp.
- Change summary.
- Approval state.
- Publication state.

### Required functions

- View revisions.
- Compare two revisions.
- View who made a change.
- Restore an earlier revision.
- Create a new revision from a restored version.
- Identify the currently published revision.
- Preserve approval history.

Restoring an older revision must not erase newer revisions.

## 6.4 Publication safety

Before publishing, validate:

- Required title.
- Valid slug.
- Required content.
- Featured image and alt text where applicable.
- Correct language.
- Approved media rights.
- Safeguarding approval where required.
- Valid internal links.
- SEO fields.
- Publication schedule.

Publication should be an atomic operation: the public site must not display partially saved content.

## 6.5 Takedown workflow

The CMS must support a post-publication takedown process.

1. Receive a takedown request.
2. Record the requester and reason.
3. Identify the affected content and media.
4. Restrict public visibility where urgent action is justified.
5. Assign a reviewer.
6. Review rights, consent and safeguarding evidence.
7. Record the decision.
8. Restore, amend or permanently remove public access.
9. Preserve the appropriate restricted audit and decision history.

A takedown must not silently erase the historical record of the decision.

---

# 7. Payment, newsletter and notification integrations

## 7.1 Payment architecture

Use a provider-independent payment adapter.

The internal application should communicate with a payment provider through a consistent interface.

### Payment flow

1. Visitor selects a donation amount.
2. Backend creates a pending donation record.
3. Backend creates a payment session with the provider.
4. Visitor completes payment on the provider's approved payment interface.
5. Provider sends a signed webhook.
6. Backend verifies the webhook signature.
7. Backend validates the event and transaction reference.
8. Backend updates the donation status.
9. Backend generates a receipt when appropriate.
10. Backend queues a confirmation notification.

The browser redirect alone must never establish that payment succeeded.

### Required controls

- Signed webhook verification.
- Idempotency.
- Duplicate-event protection.
- Transaction reconciliation.
- Refund approval.
- Payment failure handling.
- Provider outage handling.
- Currency validation.
- Provider reference storage.
- Financial audit logging.

### Provider selection

The payment integration should support the payment methods approved by ISNESI, including suitable card, mobile money and bank-transfer options where the selected provider supports them.

The final provider must be selected after confirming its availability, settlement arrangements, fees, supported currencies, webhook functionality and operational suitability for Cameroon.

## 7.2 Newsletter integration

Use a provider adapter for campaign delivery.

### Synchronisation

ISNESI should remain the authoritative source for:

- Subscriber status.
- Consent evidence.
- Consent date.
- Unsubscribe status.
- Subscriber segmentation.

The external provider handles campaign delivery and delivery-event reporting.

### Campaign workflow

`Draft → Test → Review → Approved → Scheduled → Sending → Sent`

Failed or cancelled campaigns must retain their delivery history.

### Synchronisation requirements

- Create subscribers.
- Update subscriber information.
- Unsubscribe contacts.
- Synchronise suppression status.
- Retrieve campaign status.
- Process delivery webhooks.
- Record provider failures.
- Retry temporary failures safely.

## 7.3 Notification integration

Support the following channels where configured:

- In-app notifications.
- Transactional email.
- Optional SMS.
- Optional approved messaging integrations.

### Notification events

- New ordinary enquiry.
- New restricted referral.
- Referral assigned.
- Referral review due.
- Content submitted for review.
- Content approved.
- Content changes requested.
- Scheduled publication failed.
- Donation confirmed.
- Receipt generated.
- Payment reconciliation exception.
- Newsletter campaign failure.
- User invitation.
- Password or security event.
- Backup failure.

### Notification security

Sensitive information must never appear in notification subject lines, email previews or ordinary delivery logs.

For example, send:

"An assigned safeguarding case requires your attention."

Do not send a child's name, assessment or referral details through an ordinary notification channel.

## 7.4 Integration architecture

Create a common integration layer containing:

- Provider configuration references.
- Connection status.
- Webhook endpoints.
- Signature verification.
- Event queues.
- Retry handling.
- Idempotency.
- Failure logs.
- Integration health checks.

Use background jobs for long-running tasks such as campaign delivery, media processing, scheduled publishing and report generation.

---

# 8. Audit logs, backups and recovery

## 8.1 Audit-log requirements

Audit logging must be append-only from the application's perspective.

Administrators must not be able to edit historical audit events through the normal interface.

Record:

- Actor.
- Action.
- Module.
- Entity.
- Timestamp.
- Result.
- Request ID.
- Relevant security context.
- Previous and resulting record hashes where appropriate.

Audit logs should be protected against alteration through restricted database privileges, controlled retention and independent backup.

## 8.2 Audit-log access

| Role | Audit access |
|---|---|
| Super Administrator | Full operational audit access |
| Website Administrator | Website and administrative events |
| Finance Officer | Financial events |
| Safeguarding Lead | Safeguarding access events |
| Auditor | Read-only authorised audit access |
| Other staff | No general audit access |

Sensitive case details must not be copied into audit logs.

## 8.3 Backup strategy

Use a layered backup strategy.

### Database backups

- Automated daily full backups.
- More frequent transaction-log or point-in-time recovery protection.
- Encrypted backup storage.
- Separate backup credentials.
- Retention policies.
- Backup integrity verification.

### File storage backups

- Versioning for important assets.
- Replication or backup to a separate storage location.
- Protection against accidental deletion.
- Integrity checks.
- Recovery testing.

### Configuration backups

Back up:

- Application configuration.
- Database schema and migrations.
- CMS configuration.
- Integration metadata.
- Infrastructure definitions.

Never place production secrets directly inside ordinary source-code backups.

## 8.4 Recovery objectives

Initial proposed targets:

| System | Recovery Point Objective (RPO) | Recovery Time Objective (RTO) |
|---|---:|---:|
| Public website and CMS | 1 hour | 4 hours |
| Donation records | 15 minutes | 2 hours |
| Safeguarding records | 15 minutes | 2 hours |
| Media assets | 24 hours | 8 hours |
| Audit records | 1 hour | 4 hours |

These are proposed service targets, not guarantees. The final targets must be validated against hosting capabilities, backup costs and operational requirements.

## 8.5 Recovery procedure

1. Declare the incident.
2. Identify affected systems.
3. Stop unsafe writes if necessary.
4. Preserve relevant logs and evidence.
5. Identify the last verified clean backup.
6. Restore database and file storage.
7. Restore application configuration.
8. Validate schema and data integrity.
9. Validate permissions and private storage.
10. Verify payment and notification integrations.
11. Test public and administrative functionality.
12. Reconcile transactions received during the incident.
13. Reopen services.
14. Record the incident and lessons learned.

Safeguarding records must receive special validation after restoration.

## 8.6 Recovery testing

- Verify backup integrity regularly.
- Perform restoration exercises at least quarterly.
- Test point-in-time database recovery.
- Test file restoration.
- Test recovery of restricted case attachments.
- Test payment-event replay and duplicate prevention.
- Document restoration duration.
- Record recovery-test results.

A backup that has never been restored is not a proven recovery system.

---

# 9. Application architecture and technical requirements

## 9.1 Recommended architecture

A suitable architecture is:

- Public frontend.
- Admin frontend.
- Backend API.
- PostgreSQL database.
- Authentication provider.
- Private object storage.
- Background-job worker.
- Payment adapter.
- Newsletter adapter.
- Notification service.
- Audit service.
- Backup and monitoring services.

The public frontend and admin panel may share backend services, but the admin application must have separate authentication and authorisation boundaries.

## 9.2 API structure

Suggested endpoint groups:

| API group | Example operations |
|---|---|
| `/api/auth` | Login, logout, invitation, MFA |
| `/api/admin/users` | User management |
| `/api/admin/roles` | Roles and permissions |
| `/api/admin/pages` | Page management |
| `/api/admin/programmes` | Programme management |
| `/api/admin/content` | Stories and news |
| `/api/admin/media` | Media management |
| `/api/admin/partners` | Partner management |
| `/api/admin/navigation` | Menus and footer |
| `/api/admin/enquiries` | Ordinary enquiries |
| `/api/admin/safeguarding` | Restricted case management |
| `/api/admin/donations` | Financial management |
| `/api/admin/newsletter` | Subscribers and campaigns |
| `/api/admin/kids-resources` | Kids' Corner |
| `/api/admin/settings` | Website configuration |
| `/api/admin/audit` | Audit records |
| `/api/admin/operations` | Backups and system health |

Sensitive endpoints must perform explicit permission and record-level checks.

## 9.3 Database security

- Use parameterised queries.
- Enforce foreign keys.
- Apply appropriate uniqueness constraints.
- Use database transactions for critical operations.
- Apply row-level security where supported.
- Separate application and administrative database privileges.
- Keep service-role credentials server-side.
- Restrict production database access.
- Encrypt backups.
- Monitor unusual access patterns.

## 9.4 Background jobs

Required jobs include:

- Scheduled publishing.
- Scheduled unpublishing.
- Newsletter synchronisation.
- Campaign sending.
- Notification delivery.
- Payment webhook processing.
- Receipt generation.
- Media optimisation.
- Cleanup of expired temporary files.
- Retention processing.
- Backup verification.
- Integration health checks.

Every job must be retry-safe and observable.

## 9.5 Performance and availability

Initial targets:

- Normal admin page load: under 3 seconds.
- Standard API response: under 1 second for common operations.
- Search results: under 2 seconds for ordinary datasets.
- Responsive admin experience on desktop and tablet.
- Graceful handling of provider outages.
- No public exposure of administrative endpoints.
- Monitoring for failed jobs and integration errors.

These targets should be tested under realistic production workloads.

---

# 10. Non-functional requirements

## Security

- MFA for privileged accounts.
- Secure session management.
- Encryption in transit and at rest.
- Strong authorisation.
- Secure private file storage.
- Audit logging.
- Rate limiting.
- Input validation.
- Protection against common web vulnerabilities.
- Secure secrets management.

## Privacy and safeguarding

- Data minimisation.
- Purpose limitation.
- Restricted access.
- Documented retention.
- Secure deletion.
- Consent evidence management.
- Secure referral workflows.
- Breach-response procedures.

## Accessibility

- WCAG 2.2 AA target.
- Keyboard support.
- Screen-reader compatibility.
- Accessible forms.
- Responsive layouts.
- Clear error messages.

## Maintainability

- Version-controlled migrations.
- Automated tests.
- Documented APIs.
- Structured application logs.
- Separate development, staging and production environments.
- Repeatable deployment process.

## Reliability

- Automated backups.
- Monitoring.
- Job retries.
- Integration failure handling.
- Disaster recovery procedures.
- Restoration testing.

---

# 11. Core business rules

The following rules are mandatory:

1. A user cannot publish content without the required publishing permission.
2. A contributor cannot approve their own content where independent approval is required.
3. A material change after approval must trigger reapproval.
4. A child-related story cannot be published without required safeguarding clearance.
5. A referral cannot be accessed through ordinary enquiry permissions.
6. A sensitive attachment cannot have a public storage URL.
7. An ordinary administrator cannot access full safeguarding case details by default.
8. A payment is not confirmed by a browser redirect.
9. A payment webhook must be verified and processed idempotently.
10. A refund must be authorised and audited.
11. An unsubscribed contact cannot receive a marketing campaign.
12. An asset with restricted rights cannot be published.
13. A partner cannot be publicly represented without appropriate approval.
14. A user deactivation must revoke active sessions and future access.
15. A deletion must respect retention requirements and preserve required audit evidence.
16. Audit events must not be editable through the ordinary admin interface.
17. A failed backup must create an operational alert.
18. Restoring a revision must preserve later revision history.

---

# 12. Implementation phases

Implementation should proceed in controlled stages. Sensitive data and financial functionality should not be opened to the public until their security and operational controls are tested.

## Phase 1 — Foundation

- Finalise technical stack.
- Create development, staging and production environments.
- Establish database.
- Create migrations.
- Implement authentication.
- Implement RBAC.
- Implement audit logging.
- Configure private file storage.
- Configure backups.

**Exit criteria:** Staff can authenticate securely, access is permission-controlled, migrations are repeatable and backups can be verified.

## Phase 2 — Core CMS

- Pages and sections.
- Programmes.
- Navigation and footer.
- Stories and news.
- Media library.
- Partners.
- SEO management.
- Revision history.
- Editorial approval.

**Exit criteria:** Administrators can manage all core public website content without directly editing application code.

## Phase 3 — Engagement

- Ordinary enquiries.
- Enquiry assignment.
- Response history.
- Newsletter subscribers.
- Consent management.
- Campaign management.
- Transactional notifications.

**Exit criteria:** Public submissions and communication workflows persist correctly and respect consent and access rules.

## Phase 4 — Safeguarding

- Restricted referral database.
- Separate access controls.
- Case assignment.
- Assessments and notes.
- Private attachments.
- Access logging.
- Retention controls.
- Emergency access.
- Safeguarding publishing approvals.

**Exit criteria:** Security testing confirms ordinary users cannot access restricted records or attachments.

## Phase 5 — Finance

- Donation campaigns.
- Payment provider adapter.
- Webhook verification.
- Transaction records.
- Receipts.
- Refund approvals.
- Reconciliation.
- Financial reporting.

**Exit criteria:** Test payments, failed payments, duplicate webhooks, refunds and reconciliation all work correctly.

## Phase 6 — Kids' Corner and accessibility

- Resource management.
- Resource review workflow.
- Child-safe publishing controls.
- Accessibility settings.
- Accessibility review checklist.

**Exit criteria:** Public resources cannot bypass mandatory safeguarding review.

## Phase 7 — Operations and launch

- Monitoring.
- Security testing.
- Backup restoration testing.
- Disaster recovery exercise.
- Performance testing.
- Staff training.
- Production deployment.
- Launch checklist.

**Exit criteria:** All critical workflows pass acceptance testing and responsible staff are trained.

---

# 13. Acceptance criteria

The system is not complete simply because each sidebar item opens a page.

The following must be demonstrably operational.

| Area | Acceptance test |
|---|---|
| Authentication | Staff can sign in securely and privileged accounts enforce MFA |
| Permissions | Users cannot perform actions outside their assigned permissions |
| Pages | A page can be created, reviewed, published and updated |
| Programmes | Programme changes appear correctly on the public site |
| Editorial | Content follows approval and revision workflows |
| Revisions | An earlier revision can be restored without losing history |
| Media | Assets are uploaded, optimised and rights-managed |
| Partners | Unapproved partner information cannot be published |
| Navigation | Menu changes appear correctly on the public website |
| Enquiries | Enquiries can be assigned, answered and closed |
| Referrals | Restricted cases are inaccessible to ordinary admin users |
| Referrals | Sensitive attachments are private and access is logged |
| Donations | Verified payment events update transaction records correctly |
| Donations | Duplicate webhooks cannot create duplicate donations |
| Newsletter | Consent, unsubscribe and suppression rules are enforced |
| Notifications | Failed deliveries are recorded and retried safely |
| Kids' Corner | Required child-safety reviews block premature publication |
| Settings | Public settings can be managed without exposing secrets |
| Audit | Administrative and sensitive access events are recorded |
| Backups | A database and file backup can be restored successfully |
| Recovery | Recovery exercises meet approved RPO and RTO targets |

---

# 14. Important decisions still requiring confirmation

These decisions affect implementation and must be settled before production configuration.

1. **Backend platform:** Confirm whether the project will use Supabase/PostgreSQL or another backend.
2. **Authentication:** Confirm the identity provider and MFA method.
3. **Hosting:** Confirm the application and database hosting environment.
4. **Payment provider:** Select a provider after verifying its Cameroon payment and settlement support.
5. **Newsletter provider:** Select the service responsible for campaign delivery.
6. **Transactional email:** Confirm the service used for administrative and public notifications.
7. **Referral ownership:** Confirm which staff roles are authorised to receive, assess and close safeguarding referrals.
8. **Retention schedule:** Approve retention periods for each data category.
9. **Language strategy:** Confirm which languages are required for the first production release.
10. **Backup budget:** Confirm the storage, retention and recovery-service budget.

These are configuration and governance decisions—not reasons to leave the architecture incomplete.

---

# 15. Final definition of completion

The ISNESI Admin Panel will be considered production-ready when:

- Every public website module has a functional management interface.
- The backend database supports all required records and relationships.
- All staff access is controlled through enforceable permissions.
- Child referrals are securely separated from ordinary enquiries.
- Editorial content has approval and revision history.
- Donations are processed through a verified payment integration.
- Newsletter consent and unsubscribe rules are enforced.
- Notifications are reliable and do not expose sensitive information.
- Administrative activity is auditable.
- Backups are automated and recovery has been tested.
- The system passes security, accessibility and operational acceptance tests.

**The guiding standard:** ISNESI staff should be able to operate and manage the entire public website from the admin panel, while sensitive information, financial records and publishing authority remain properly controlled.

---