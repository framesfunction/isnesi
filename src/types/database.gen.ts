
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": number,"metadata": NonNullable<Json>,"new_data": Json | null,"old_data": Json | null,"record_id": string | null,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"new_data"?: Json | null,"old_data"?: Json | null,"record_id"?: string | null,"table_name": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"new_data"?: Json | null,"old_data"?: Json | null,"record_id"?: string | null,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"id": string,"key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"category_translations": {
                  Row: {
                    "category_id": string,"label": string,"locale": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"label": string,"locale": string
                  }
                  Update: {
                    "category_id"?: string,"label"?: string,"locale"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "category_translations_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"content_approvals": {
                  Row: {
                    "content_id": string,"decided_at": string,"decision": string,"id": string,"note": string | null,"reviewer_id": string,"revision_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "content_id": string,"decided_at"?: string,"decision": string,"id"?: string,"note"?: string | null,"reviewer_id": string,"revision_id": number
                  }
                  Update: {
                    "content_id"?: string,"decided_at"?: string,"decision"?: string,"id"?: string,"note"?: string | null,"reviewer_id"?: string,"revision_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_approvals_content_id_fkey"
      columns: ["content_id"]
isOneToOne: false
      referencedRelation: "content_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "content_approvals_revision_id_fkey"
      columns: ["revision_id"]
isOneToOne: false
      referencedRelation: "content_revisions"
      referencedColumns: ["id"]
    }
                  ]
                },"content_categories": {
                  Row: {
                    "category_id": string,"content_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"content_id": string
                  }
                  Update: {
                    "category_id"?: string,"content_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "content_categories_content_id_fkey"
      columns: ["content_id"]
isOneToOne: false
      referencedRelation: "content_items"
      referencedColumns: ["id"]
    }
                  ]
                },"content_items": {
                  Row: {
                    "allow_comments": boolean,"author_id": string | null,"content_type": string,"created_at": string,"featured": boolean,"id": string,"published_at": string | null,"reviewer_id": string | null,"scheduled_at": string | null,"slug": string,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_comments"?: boolean,"author_id"?: string | null,"content_type": string,"created_at"?: string,"featured"?: boolean,"id"?: string,"published_at"?: string | null,"reviewer_id"?: string | null,"scheduled_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "allow_comments"?: boolean,"author_id"?: string | null,"content_type"?: string,"created_at"?: string,"featured"?: boolean,"id"?: string,"published_at"?: string | null,"reviewer_id"?: string | null,"scheduled_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"content_relationships": {
                  Row: {
                    "relationship": string,"source_id": string,"target_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "relationship"?: string,"source_id": string,"target_id": string
                  }
                  Update: {
                    "relationship"?: string,"source_id"?: string,"target_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_relationships_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "content_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "content_relationships_target_id_fkey"
      columns: ["target_id"]
isOneToOne: false
      referencedRelation: "content_items"
      referencedColumns: ["id"]
    }
                  ]
                },"content_revisions": {
                  Row: {
                    "change_note": string | null,"changed_by": string | null,"content_id": string,"created_at": string,"id": number,"revision_no": number,"snapshot": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "change_note"?: string | null,"changed_by"?: string | null,"content_id": string,"created_at"?: string,"id"?: never,"revision_no": number,"snapshot": NonNullable<Json>
                  }
                  Update: {
                    "change_note"?: string | null,"changed_by"?: string | null,"content_id"?: string,"created_at"?: string,"id"?: never,"revision_no"?: number,"snapshot"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_revisions_content_id_fkey"
      columns: ["content_id"]
isOneToOne: false
      referencedRelation: "content_items"
      referencedColumns: ["id"]
    }
                  ]
                },"content_tags": {
                  Row: {
                    "content_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content_id": string,"tag_id": string
                  }
                  Update: {
                    "content_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_tags_content_id_fkey"
      columns: ["content_id"]
isOneToOne: false
      referencedRelation: "content_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "content_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"content_translations": {
                  Row: {
                    "body": NonNullable<Json>,"content_id": string,"excerpt": string | null,"id": string,"locale": string,"seo_description": string | null,"seo_title": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"content_id": string,"excerpt"?: string | null,"id"?: string,"locale": string,"seo_description"?: string | null,"seo_title"?: string | null,"title": string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"content_id"?: string,"excerpt"?: string | null,"id"?: string,"locale"?: string,"seo_description"?: string | null,"seo_title"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_translations_content_id_fkey"
      columns: ["content_id"]
isOneToOne: false
      referencedRelation: "content_items"
      referencedColumns: ["id"]
    }
                  ]
                },"donation_campaign_translations": {
                  Row: {
                    "campaign_id": string,"description": string | null,"locale": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "campaign_id": string,"description"?: string | null,"locale": string,"title": string
                  }
                  Update: {
                    "campaign_id"?: string,"description"?: string | null,"locale"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "donation_campaign_translations_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "donation_campaigns"
      referencedColumns: ["id"]
    }
                  ]
                },"donation_campaigns": {
                  Row: {
                    "created_at": string,"ends_at": string | null,"id": string,"is_active": boolean,"key": string,"starts_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_at"?: string | null,"id"?: string,"is_active"?: boolean,"key": string,"starts_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"ends_at"?: string | null,"id"?: string,"is_active"?: boolean,"key"?: string,"starts_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"donation_refunds": {
                  Row: {
                    "amount_minor": number,"approved_at": string | null,"approved_by": string | null,"created_at": string,"donation_id": string,"id": string,"provider_refund_id": string | null,"provider_status": string | null,"reason": string | null,"requested_by": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"donation_id": string,"id"?: string,"provider_refund_id"?: string | null,"provider_status"?: string | null,"reason"?: string | null,"requested_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "amount_minor"?: number,"approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"donation_id"?: string,"id"?: string,"provider_refund_id"?: string | null,"provider_status"?: string | null,"reason"?: string | null,"requested_by"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "donation_refunds_donation_id_fkey"
      columns: ["donation_id"]
isOneToOne: false
      referencedRelation: "donations"
      referencedColumns: ["id"]
    }
                  ]
                },"donations": {
                  Row: {
                    "amount_minor": number,"campaign_id": string | null,"created_at": string,"currency": string,"donation_type": string,"donor_email": string | null,"donor_name": string | null,"id": string,"is_anonymous": boolean,"paid_at": string | null,"payment_status": Database["public"]['Enums']["payment_status"],"provider_key": string | null,"provider_transaction_id": string | null,"public_reference": string,"receipt_issued_at": string | null,"receipt_number": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"campaign_id"?: string | null,"created_at"?: string,"currency"?: string,"donation_type"?: string,"donor_email"?: string | null,"donor_name"?: string | null,"id"?: string,"is_anonymous"?: boolean,"paid_at"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"provider_key"?: string | null,"provider_transaction_id"?: string | null,"public_reference"?: string,"receipt_issued_at"?: string | null,"receipt_number"?: string | null
                  }
                  Update: {
                    "amount_minor"?: number,"campaign_id"?: string | null,"created_at"?: string,"currency"?: string,"donation_type"?: string,"donor_email"?: string | null,"donor_name"?: string | null,"id"?: string,"is_anonymous"?: boolean,"paid_at"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"provider_key"?: string | null,"provider_transaction_id"?: string | null,"public_reference"?: string,"receipt_issued_at"?: string | null,"receipt_number"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "donations_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "donation_campaigns"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiry_assignments": {
                  Row: {
                    "assigned_at": string,"assigned_by": string | null,"assigned_from": string | null,"assigned_to": string,"enquiry_id": string,"id": string,"reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"assigned_from"?: string | null,"assigned_to": string,"enquiry_id": string,"id"?: string,"reason"?: string | null
                  }
                  Update: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"assigned_from"?: string | null,"assigned_to"?: string,"enquiry_id"?: string,"id"?: string,"reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiry_assignments_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "general_enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiry_messages": {
                  Row: {
                    "body": string | null,"channel": string,"delivery_status": string,"direction": string,"enquiry_id": string,"id": string,"message_reference": string | null,"sent_at": string,"sent_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"channel"?: string,"delivery_status"?: string,"direction": string,"enquiry_id": string,"id"?: string,"message_reference"?: string | null,"sent_at"?: string,"sent_by"?: string | null
                  }
                  Update: {
                    "body"?: string | null,"channel"?: string,"delivery_status"?: string,"direction"?: string,"enquiry_id"?: string,"id"?: string,"message_reference"?: string | null,"sent_at"?: string,"sent_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiry_messages_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "general_enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiry_notes": {
                  Row: {
                    "author_id": string | null,"created_at": string,"enquiry_id": string,"id": string,"note": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"created_at"?: string,"enquiry_id": string,"id"?: string,"note": string
                  }
                  Update: {
                    "author_id"?: string | null,"created_at"?: string,"enquiry_id"?: string,"id"?: string,"note"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiry_notes_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "general_enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"finance_reconciliations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"currency": string,"id": string,"notes": string | null,"period_end": string,"period_start": string,"provider_key": string | null,"statement_reference": string | null,"status": string,"total_minor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"notes"?: string | null,"period_end": string,"period_start": string,"provider_key"?: string | null,"statement_reference"?: string | null,"status"?: string,"total_minor"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"notes"?: string | null,"period_end"?: string,"period_start"?: string,"provider_key"?: string | null,"statement_reference"?: string | null,"status"?: string,"total_minor"?: number
                  }
                  Relationships: [
                    
                  ]
                },"general_enquiries": {
                  Row: {
                    "assigned_to": string | null,"closed_at": string | null,"consent_to_contact": boolean,"created_at": string,"email": string | null,"enquiry_type": string,"full_name": string,"id": string,"message": string,"phone": string | null,"reference_code": string,"source": string,"status": Database["public"]['Enums']["enquiry_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"closed_at"?: string | null,"consent_to_contact"?: boolean,"created_at"?: string,"email"?: string | null,"enquiry_type": string,"full_name": string,"id"?: string,"message": string,"phone"?: string | null,"reference_code"?: string,"source"?: string,"status"?: Database["public"]['Enums']["enquiry_status"],"updated_at"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"closed_at"?: string | null,"consent_to_contact"?: boolean,"created_at"?: string,"email"?: string | null,"enquiry_type"?: string,"full_name"?: string,"id"?: string,"message"?: string,"phone"?: string | null,"reference_code"?: string,"source"?: string,"status"?: Database["public"]['Enums']["enquiry_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"kids_resource_translations": {
                  Row: {
                    "content": NonNullable<Json>,"description": string | null,"locale": string,"resource_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content"?: NonNullable<Json>,"description"?: string | null,"locale": string,"resource_id": string,"title": string
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"description"?: string | null,"locale"?: string,"resource_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "kids_resource_translations_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "kids_resources"
      referencedColumns: ["id"]
    }
                  ]
                },"kids_resources": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"is_featured": boolean,"max_age": number | null,"min_age": number | null,"resource_type": string,"safeguarding_approved": boolean,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_featured"?: boolean,"max_age"?: number | null,"min_age"?: number | null,"resource_type": string,"safeguarding_approved"?: boolean,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_featured"?: boolean,"max_age"?: number | null,"min_age"?: number | null,"resource_type"?: string,"safeguarding_approved"?: boolean,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"media_assets": {
                  Row: {
                    "alt_text": string | null,"bucket_id": string,"byte_size": number | null,"caption": string | null,"consent_reference": string | null,"created_at": string,"credit": string | null,"file_name": string,"height": number | null,"id": string,"mime_type": string | null,"object_path": string,"rights_reference": string | null,"rights_status": string,"safeguarding_reviewed": boolean,"uploaded_by": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"bucket_id"?: string,"byte_size"?: number | null,"caption"?: string | null,"consent_reference"?: string | null,"created_at"?: string,"credit"?: string | null,"file_name": string,"height"?: number | null,"id"?: string,"mime_type"?: string | null,"object_path": string,"rights_reference"?: string | null,"rights_status"?: string,"safeguarding_reviewed"?: boolean,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Update: {
                    "alt_text"?: string | null,"bucket_id"?: string,"byte_size"?: number | null,"caption"?: string | null,"consent_reference"?: string | null,"created_at"?: string,"credit"?: string | null,"file_name"?: string,"height"?: number | null,"id"?: string,"mime_type"?: string | null,"object_path"?: string,"rights_reference"?: string | null,"rights_status"?: string,"safeguarding_reviewed"?: boolean,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"media_usage": {
                  Row: {
                    "entity_id": string,"entity_type": string,"media_id": string,"usage_role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "entity_id": string,"entity_type": string,"media_id": string,"usage_role"?: string
                  }
                  Update: {
                    "entity_id"?: string,"entity_type"?: string,"media_id"?: string,"usage_role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_usage_media_id_fkey"
      columns: ["media_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    }
                  ]
                },"navigation_items": {
                  Row: {
                    "href": string,"id": string,"is_visible": boolean,"label": string,"menu_id": string,"open_new_tab": boolean,"parent_id": string | null,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "href": string,"id"?: string,"is_visible"?: boolean,"label": string,"menu_id": string,"open_new_tab"?: boolean,"parent_id"?: string | null,"sort_order"?: number
                  }
                  Update: {
                    "href"?: string,"id"?: string,"is_visible"?: boolean,"label"?: string,"menu_id"?: string,"open_new_tab"?: boolean,"parent_id"?: string | null,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "navigation_items_menu_id_fkey"
      columns: ["menu_id"]
isOneToOne: false
      referencedRelation: "navigation_menus"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "navigation_items_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "navigation_items"
      referencedColumns: ["id"]
    }
                  ]
                },"navigation_menus": {
                  Row: {
                    "id": string,"key": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"key": string,"label": string
                  }
                  Update: {
                    "id"?: string,"key"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"newsletter_campaigns": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"body": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"name": string,"provider_campaign_reference": string | null,"scheduled_at": string | null,"sent_at": string | null,"status": string,"subject": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"body"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string,"provider_campaign_reference"?: string | null,"scheduled_at"?: string | null,"sent_at"?: string | null,"status"?: string,"subject": string
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"body"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string,"provider_campaign_reference"?: string | null,"scheduled_at"?: string | null,"sent_at"?: string | null,"status"?: string,"subject"?: string
                  }
                  Relationships: [
                    
                  ]
                },"newsletter_consents": {
                  Row: {
                    "evidence_reference": string | null,"id": string,"ip_hash": string | null,"policy_version": string | null,"recorded_at": string,"revoked_at": string | null,"source": string,"status": Database["public"]['Enums']["consent_status"],"subscriber_id": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "evidence_reference"?: string | null,"id"?: string,"ip_hash"?: string | null,"policy_version"?: string | null,"recorded_at"?: string,"revoked_at"?: string | null,"source": string,"status": Database["public"]['Enums']["consent_status"],"subscriber_id": string,"user_agent"?: string | null
                  }
                  Update: {
                    "evidence_reference"?: string | null,"id"?: string,"ip_hash"?: string | null,"policy_version"?: string | null,"recorded_at"?: string,"revoked_at"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["consent_status"],"subscriber_id"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "newsletter_consents_subscriber_id_fkey"
      columns: ["subscriber_id"]
isOneToOne: false
      referencedRelation: "newsletter_subscribers"
      referencedColumns: ["id"]
    }
                  ]
                },"newsletter_events": {
                  Row: {
                    "campaign_id": string | null,"event_type": string,"id": number,"occurred_at": string,"provider_event_id": string | null,"subscriber_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "campaign_id"?: string | null,"event_type": string,"id"?: never,"occurred_at"?: string,"provider_event_id"?: string | null,"subscriber_id"?: string | null
                  }
                  Update: {
                    "campaign_id"?: string | null,"event_type"?: string,"id"?: never,"occurred_at"?: string,"provider_event_id"?: string | null,"subscriber_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "newsletter_events_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "newsletter_campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "newsletter_events_subscriber_id_fkey"
      columns: ["subscriber_id"]
isOneToOne: false
      referencedRelation: "newsletter_subscribers"
      referencedColumns: ["id"]
    }
                  ]
                },"newsletter_segment_members": {
                  Row: {
                    "added_at": string,"segment_id": string,"subscriber_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"segment_id": string,"subscriber_id": string
                  }
                  Update: {
                    "added_at"?: string,"segment_id"?: string,"subscriber_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "newsletter_segment_members_segment_id_fkey"
      columns: ["segment_id"]
isOneToOne: false
      referencedRelation: "newsletter_segments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "newsletter_segment_members_subscriber_id_fkey"
      columns: ["subscriber_id"]
isOneToOne: false
      referencedRelation: "newsletter_subscribers"
      referencedColumns: ["id"]
    }
                  ]
                },"newsletter_segments": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"name": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"newsletter_subscribers": {
                  Row: {
                    "confirmed_at": string | null,"created_at": string,"email": string,"full_name": string | null,"id": string,"locale": string,"provider_contact_reference": string | null,"status": string,"subscribed_at": string | null,"unsubscribed_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmed_at"?: string | null,"created_at"?: string,"email": string,"full_name"?: string | null,"id"?: string,"locale"?: string,"provider_contact_reference"?: string | null,"status"?: string,"subscribed_at"?: string | null,"unsubscribed_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "confirmed_at"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"locale"?: string,"provider_contact_reference"?: string | null,"status"?: string,"subscribed_at"?: string | null,"unsubscribed_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notification_delivery_attempts": {
                  Row: {
                    "attempt_number": number,"attempted_at": string,"error_code": string | null,"id": number,"notification_id": string,"provider_reference": string | null,"result": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempt_number"?: number,"attempted_at"?: string,"error_code"?: string | null,"id"?: never,"notification_id": string,"provider_reference"?: string | null,"result": string
                  }
                  Update: {
                    "attempt_number"?: number,"attempted_at"?: string,"error_code"?: string | null,"id"?: never,"notification_id"?: string,"provider_reference"?: string | null,"result"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_delivery_attempts_notification_id_fkey"
      columns: ["notification_id"]
isOneToOne: false
      referencedRelation: "notifications"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_templates": {
                  Row: {
                    "body_template": string,"channel": string,"id": string,"language_code": string,"status": string,"subject": string,"template_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body_template": string,"channel": string,"id"?: string,"language_code"?: string,"status"?: string,"subject": string,"template_key": string
                  }
                  Update: {
                    "body_template"?: string,"channel"?: string,"id"?: string,"language_code"?: string,"status"?: string,"subject"?: string,"template_key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "channel": string,"created_at": string,"delivery_status": string,"id": string,"notification_type": string,"recipient_user_id": string,"related_entity_id": string | null,"related_entity_type": string | null,"sent_at": string | null,"template_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": string,"created_at"?: string,"delivery_status"?: string,"id"?: string,"notification_type": string,"recipient_user_id": string,"related_entity_id"?: string | null,"related_entity_type"?: string | null,"sent_at"?: string | null,"template_id"?: string | null
                  }
                  Update: {
                    "channel"?: string,"created_at"?: string,"delivery_status"?: string,"id"?: string,"notification_type"?: string,"recipient_user_id"?: string,"related_entity_id"?: string | null,"related_entity_type"?: string | null,"sent_at"?: string | null,"template_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "notification_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"page_sections": {
                  Row: {
                    "config": NonNullable<Json>,"created_at": string,"id": string,"is_enabled": boolean,"page_id": string,"section_key": string,"section_type": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_enabled"?: boolean,"page_id": string,"section_key": string,"section_type": string,"sort_order"?: number
                  }
                  Update: {
                    "config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_enabled"?: boolean,"page_id"?: string,"section_key"?: string,"section_type"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "page_sections_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "pages"
      referencedColumns: ["id"]
    }
                  ]
                },"page_translations": {
                  Row: {
                    "body": NonNullable<Json>,"canonical_url": string | null,"excerpt": string | null,"id": string,"locale": string,"page_id": string,"seo_description": string | null,"seo_title": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"canonical_url"?: string | null,"excerpt"?: string | null,"id"?: string,"locale": string,"page_id": string,"seo_description"?: string | null,"seo_title"?: string | null,"title": string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"canonical_url"?: string | null,"excerpt"?: string | null,"id"?: string,"locale"?: string,"page_id"?: string,"seo_description"?: string | null,"seo_title"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "page_translations_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "pages"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"page_type": string,"published_at": string | null,"show_in_navigation": boolean,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["content_status"],"template_key": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"page_type"?: string,"published_at"?: string | null,"show_in_navigation"?: boolean,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"template_key"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"page_type"?: string,"published_at"?: string | null,"show_in_navigation"?: boolean,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"template_key"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"partner_translations": {
                  Row: {
                    "description": string | null,"locale": string,"partner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"locale": string,"partner_id": string
                  }
                  Update: {
                    "description"?: string | null,"locale"?: string,"partner_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "partner_translations_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    }
                  ]
                },"partners": {
                  Row: {
                    "approval_status": string,"approved_at": string | null,"approved_by": string | null,"created_at": string,"id": string,"logo_media_id": string | null,"name": string,"public_visible": boolean,"relationship_type": string | null,"updated_at": string,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "approval_status"?: string,"approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"id"?: string,"logo_media_id"?: string | null,"name": string,"public_visible"?: boolean,"relationship_type"?: string | null,"updated_at"?: string,"website_url"?: string | null
                  }
                  Update: {
                    "approval_status"?: string,"approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"id"?: string,"logo_media_id"?: string | null,"name"?: string,"public_visible"?: boolean,"relationship_type"?: string | null,"updated_at"?: string,"website_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "partners_logo_media_id_fkey"
      columns: ["logo_media_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_events": {
                  Row: {
                    "created_at": string,"donation_id": string | null,"event_type": string,"id": number,"payload": NonNullable<Json>,"processed_at": string | null,"provider_event_id": string,"provider_key": string,"signature_valid": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"donation_id"?: string | null,"event_type": string,"id"?: never,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider_event_id": string,"provider_key": string,"signature_valid"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"donation_id"?: string | null,"event_type"?: string,"id"?: never,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider_event_id"?: string,"provider_key"?: string,"signature_valid"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_events_donation_id_fkey"
      columns: ["donation_id"]
isOneToOne: false
      referencedRelation: "donations"
      referencedColumns: ["id"]
    }
                  ]
                },"permissions": {
                  Row: {
                    "description": string | null,"id": string,"key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"id"?: string,"key": string
                  }
                  Update: {
                    "description"?: string | null,"id"?: string,"key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"display_name": string | null,"id": string,"is_active": boolean,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"is_active"?: boolean,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"is_active"?: boolean,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"programme_translations": {
                  Row: {
                    "body": NonNullable<Json>,"locale": string,"programme_id": string,"seo_description": string | null,"seo_title": string | null,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"locale": string,"programme_id": string,"seo_description"?: string | null,"seo_title"?: string | null,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"locale"?: string,"programme_id"?: string,"seo_description"?: string | null,"seo_title"?: string | null,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "programme_translations_programme_id_fkey"
      columns: ["programme_id"]
isOneToOne: false
      referencedRelation: "programmes"
      referencedColumns: ["id"]
    }
                  ]
                },"programmes": {
                  Row: {
                    "activities": NonNullable<Json>,"created_at": string,"featured_image_id": string | null,"geographic_coverage": string | null,"icon": string | null,"id": string,"is_active": boolean,"key": string,"objectives": NonNullable<Json>,"sort_order": number,"target_beneficiaries": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activities"?: NonNullable<Json>,"created_at"?: string,"featured_image_id"?: string | null,"geographic_coverage"?: string | null,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"key": string,"objectives"?: NonNullable<Json>,"sort_order"?: number,"target_beneficiaries"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "activities"?: NonNullable<Json>,"created_at"?: string,"featured_image_id"?: string | null,"geographic_coverage"?: string | null,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"key"?: string,"objectives"?: NonNullable<Json>,"sort_order"?: number,"target_beneficiaries"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "programmes_featured_image_id_fkey"
      columns: ["featured_image_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    }
                  ]
                },"role_permissions": {
                  Row: {
                    "permission_id": string,"role_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "permission_id": string,"role_id": string
                  }
                  Update: {
                    "permission_id"?: string,"role_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_permissions_permission_id_fkey"
      columns: ["permission_id"]
isOneToOne: false
      referencedRelation: "permissions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "role_permissions_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                },"roles": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"is_system": boolean,"key": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_system"?: boolean,"key": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_system"?: boolean,"key"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "is_public": boolean,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "is_public"?: boolean,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Update: {
                    "is_public"?: boolean,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"tag_translations": {
                  Row: {
                    "label": string,"locale": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "label": string,"locale": string,"tag_id": string
                  }
                  Update: {
                    "label"?: string,"locale"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tag_translations_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "id": string,"key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"key": string
                  }
                  Update: {
                    "id"?: string,"key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_roles": {
                  Row: {
                    "assigned_at": string,"assigned_by": string | null,"expires_at": string | null,"role_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"expires_at"?: string | null,"role_id": string,"user_id": string
                  }
                  Update: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"expires_at"?: string | null,"role_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "consent_status": "granted"|"withdrawn"|"expired","content_status": "draft"|"in_review"|"approved"|"scheduled"|"published"|"rejected"|"archived","enquiry_status": "new"|"triaged"|"assigned"|"in_progress"|"waiting"|"closed"|"spam","payment_status": "created"|"pending"|"succeeded"|"failed"|"cancelled"|"refunded"|"partially_refunded"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "consent_status": ["granted", "withdrawn", "expired"],"content_status": ["draft", "in_review", "approved", "scheduled", "published", "rejected", "archived"],"enquiry_status": ["new", "triaged", "assigned", "in_progress", "waiting", "closed", "spam"],"payment_status": ["created", "pending", "succeeded", "failed", "cancelled", "refunded", "partially_refunded"]
          }
        }
} as const
