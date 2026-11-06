-- Safe reference data only. No real users, children, donors or contact records.
insert into public.site_settings(key,value,is_public) values
 ('organisation', '{"name":"ISNESI","tagline":"We Leave No Child Behind.","address":"P.O. Box 1234, Yaounde, Cameroon","phone":"+237 22 22 22 22","email":"info@isnesi.cm","opening_hours":"Mon-Fri 8:00-17:00"}', true),
 ('locales', '{"default":"en","enabled":["en","fr"]}', true),
 ('donation', '{"currency":"XAF","enabled":false}', true),
 ('seo', '{"defaultTitle":"ISNESI — Inclusive Support for Needs and Education","defaultDescription":"Promoting inclusion, education and opportunity for children with disabilities across Cameroon.","defaultImage":"/icons/og-default.png"}', true),
 ('maintenance', '{"enabled":false,"message":"The site is temporarily offline for maintenance. Please check back soon."}', false),
 ('spam_protection', '{"enabled":true,"provider":"turnstile","site_key":""}', false),
 ('analytics', '{"enabled":true,"provider":"plausible","endpoint":"/api/collect"}', false)
on conflict (key) do nothing;

insert into public.navigation_menus(key,label) values
 ('main','Main navigation'),('footer','Footer navigation')
on conflict (key) do nothing;

insert into public.programmes(key,icon,sort_order) values
 ('inclusive-education','📚',1),
 ('special-needs-support','💚',2),
 ('social-innovation','💡',3),
 ('capacity-building','🌱',4),
 ('advocacy-awareness','📣',5),
 ('partnerships','🤝',6)
on conflict (key) do nothing;

insert into public.programme_translations(programme_id,locale,title,summary)
select id,'en',
 case key
  when 'inclusive-education' then 'Inclusive Education'
  when 'special-needs-support' then 'Special Needs Support'
  when 'social-innovation' then 'Social Innovation'
  when 'capacity-building' then 'Capacity Building'
  when 'advocacy-awareness' then 'Advocacy & Awareness'
  else 'Partnerships' end,
 case key
  when 'inclusive-education' then 'Promoting equal access to quality education for children with disabilities.'
  when 'special-needs-support' then 'Educational, psychosocial and developmental support tailored to individual needs.'
  when 'social-innovation' then 'Practical and sustainable solutions to barriers faced by persons with disabilities.'
  when 'capacity-building' then 'Training teachers, parents, caregivers, communities and stakeholders.'
  when 'advocacy-awareness' then 'Challenging discrimination, stigma and exclusion while promoting disability rights.'
  else 'Working with government, schools, communities, NGOs and stakeholders.' end
from public.programmes
on conflict (programme_id,locale) do nothing;

update public.programmes set
  objectives = case key
    when 'inclusive-education' then '["Promote enrolment of children with disabilities in mainstream schools","Adapt teaching and learning materials to different needs","Train teachers in inclusive classroom practice"]'::jsonb
    when 'special-needs-support' then '["Provide individual education plans","Offer psychosocial and developmental support","Guide families to the services they need"]'::jsonb
    when 'social-innovation' then '["Prototype low-cost assistive tools","Document solutions that work locally","Share what works with partners"]'::jsonb
    when 'capacity-building' then '["Strengthen teacher and caregiver skills","Build community knowledge of inclusive practice","Support schools to plan sustainably"]'::jsonb
    when 'advocacy-awareness' then '["Challenge stigma and discrimination","Promote the rights of persons with disabilities","Raise community awareness of inclusion"]'::jsonb
    else '["Work with government, schools and communities","Extend reach through shared programmes","Report transparently on results"]'::jsonb
  end,
  activities = case key
    when 'inclusive-education' then '["School enrolment support","Classroom adaptations","Teacher coaching"]'::jsonb
    when 'special-needs-support' then '["Individual assessments","Therapy and learning sessions","Family guidance"]'::jsonb
    when 'social-innovation' then '["Co-design workshops","Pilot projects","Learning reviews"]'::jsonb
    when 'capacity-building' then '["Training workshops","Peer learning","Follow-up mentoring"]'::jsonb
    when 'advocacy-awareness' then '["Community dialogues","Awareness campaigns","Rights information sessions"]'::jsonb
    else '["Joint planning","Resource sharing","Monitoring and reporting"]'::jsonb
  end,
  target_beneficiaries = case key
    when 'inclusive-education' then 'Children with disabilities and their schools'
    when 'special-needs-support' then 'Children with disabilities and their families'
    when 'social-innovation' then 'Persons with disabilities and local innovators'
    when 'capacity-building' then 'Teachers, parents, caregivers and communities'
    when 'advocacy-awareness' then 'Communities, leaders and decision-makers'
    else 'Communities, schools and partner organisations'
  end,
  geographic_coverage = 'Cameroon'
where key in ('inclusive-education','special-needs-support','social-innovation','capacity-building','advocacy-awareness','partnerships');

update public.programme_translations t
set body = jsonb_build_object('blocks', case p.key
    when 'inclusive-education' then '[{"type":"paragraph","text":"Inclusive education means children with disabilities learn alongside their peers, with the support that makes participation real."},{"type":"callout","text":"Every barrier we remove is a child moving forward."}]'::jsonb
    when 'special-needs-support' then '[{"type":"paragraph","text":"Support is shaped around each child: their strengths, their needs and their goals."}]'::jsonb
    when 'social-innovation' then '[{"type":"paragraph","text":"We design practical, affordable solutions to the barriers children and families face every day."}]'::jsonb
    when 'capacity-building' then '[{"type":"paragraph","text":"Skills and confidence grow when teachers, parents and communities learn together."}]'::jsonb
    when 'advocacy-awareness' then '[{"type":"paragraph","text":"We challenge stigma and promote the rights of persons with disabilities."}]'::jsonb
    else '[{"type":"paragraph","text":"Partnerships let us reach further and learn faster than working alone."}]'::jsonb
  end)
from public.programmes p
where p.id = t.programme_id and t.locale = 'en';

-- Navigation items for main menu
insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Home','/',1,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Programmes','/programmes',2,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Stories & News','/stories',3,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Get Involved','/get-involved',4,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Donate','/donate',5,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Impact','/impact',6,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Kids Corner','/kids',7,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'About','/about',8,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Contact','/contact',9,true,false from public.navigation_menus m where m.key='main'
on conflict do nothing;

-- Footer navigation items
insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Privacy','/privacy',1,true,false from public.navigation_menus m where m.key='footer'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Terms','/terms',2,true,false from public.navigation_menus m where m.key='footer'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Accessibility','/accessibility',3,true,false from public.navigation_menus m where m.key='footer'
on conflict do nothing;

insert into public.navigation_items(menu_id,parent_id,label,href,sort_order,is_visible,open_new_tab)
select m.id,null,'Safeguarding','/safeguarding',4,true,false from public.navigation_menus m where m.key='footer'
on conflict do nothing;

-- CMS pages
with p as (
  insert into public.pages(slug,page_type,status,template_key,show_in_navigation,sort_order,published_at)
  values
   ('about','standard','published','default',true,1,now()),
   ('impact','standard','published','default',true,2,now()),
   ('contact','standard','published','default',true,3,now()),
   ('programmes','editorial_index','published','default',true,4,now()),
   ('stories','editorial_index','published','default',true,5,now()),
   ('kids-corner','standard','published','default',true,6,now()),
   ('donate','standard','published','default',true,7,now()),
   ('get-involved','standard','published','default',true,8,now()),
   ('privacy','policy','published','default',false,9,null),
   ('terms','policy','published','default',false,10,null),
   ('accessibility','standard','published','default',false,11,null),
   ('safeguarding','policy','published','default',false,12,null),
   ('404','standard','published','default',false,13,null)
  returning id, slug
)
insert into public.page_translations(page_id,locale,title,excerpt,seo_title,seo_description,canonical_url,body)
select p.id,'en',
 case p.slug
  when 'about' then 'About ISNESI'
  when 'impact' then 'Our Impact'
  when 'contact' then 'Contact Us'
  when 'programmes' then 'Our Programmes'
  when 'stories' then 'Stories & News'
  when 'kids-corner' then "Kids' Corner"
  when 'donate' then 'Donate'
  when 'get-involved' then 'Get Involved'
  when 'privacy' then 'Privacy Notice'
  when 'terms' then 'Terms of Service'
  when 'accessibility' then 'Accessibility Statement'
  when 'safeguarding' then 'Safeguarding Statement'
  else 'Page Not Found' end,
 case p.slug
  when 'about' then 'ISNESI works for children with disabilities and their families across Cameroon.'
  when 'impact' then 'See the figures behind our work, each approved and sourced.'
  when 'contact' then 'Get in touch with the ISNESI team.'
  when 'programmes' then 'Explore our programme areas: inclusive education, special needs support and more.'
  when 'stories' then 'Read the latest stories, news and announcements from our community.'
  when 'kids-corner' then 'Safe, age-appropriate learning resources for children.'
  when 'donate' then 'Support our work with a donation.'
  when 'get-involved' then 'Volunteer, partner or enquire about joining our mission.'
  when 'privacy' then 'How we collect, use and protect your personal information.'
  when 'terms' then 'Terms governing your use of this website.'
  when 'accessibility' then 'Our commitment to an accessible website for everyone.'
  when 'safeguarding' then 'Our safeguarding policy and procedures.'
  else 'The page you are looking for could not be found.' end,
 case p.slug
  when 'about' then 'About ISNESI | ISNESI'
  when 'impact' then 'Our Impact | ISNESI'
  when 'contact' then 'Contact Us | ISNESI'
  when 'programmes' then 'Our Programmes | ISNESI'
  when 'stories' then 'Stories & News | ISNESI'
  when 'kids-corner' then "Kids' Corner | ISNESI"
  when 'donate' then 'Donate | ISNESI'
  when 'get-involved' then 'Get Involved | ISNESI'
  when 'privacy' then 'Privacy Notice | ISNESI'
  when 'terms' then 'Terms of Service | ISNESI'
  when 'accessibility' then 'Accessibility Statement | ISNESI'
  when 'safeguarding' then 'Safeguarding Statement | ISNESI'
  else 'Page Not Found | ISNESI' end,
 case p.slug
  when 'about' then 'Learn about ISNESI, our mission and our work for children with disabilities in Cameroon.'
  when 'impact' then 'Approved impact figures published by ISNESI, each with a source and evidence link.'
  when 'contact' then 'Contact ISNESI by email, phone or through our enquiry form.'
  when 'programmes' then 'ISNESI programme areas: inclusive education, special needs support, social innovation, capacity building, advocacy and partnerships.'
  when 'stories' then 'Stories, news, announcements and policy notices from ISNESI.'
  when 'kids-corner' then 'Child-facing learning resources, reviewed for safeguarding before publication.'
  when 'donate' then 'Donate to ISNESI and support children with disabilities and their families.'
  when 'get-involved' then 'Ways to help ISNESI: volunteering, partnerships, enquiries and more.'
  when 'privacy' then 'ISNESI privacy notice: how we handle personal data.'
  when 'terms' then 'ISNESI terms of service for website use.'
  when 'accessibility' then 'ISNESI accessibility statement and WCAG conformance information.'
  when 'safeguarding' then 'ISNESI safeguarding policy, procedures and reporting channels.'
  else 'Page not found on the ISNESI website.' end,
 '/'||p.slug,
 jsonb_build_object('blocks',
  case p.slug
   when 'about' then '[{"type":"heading","text":"About ISNESI","level":2},{"type":"paragraph","text":"ISNESI is a Cameroonian organisation working for children with disabilities and their families. We believe every child deserves an education, dignity and the chance to thrive."},{"type":"paragraph","text":"Our work spans inclusive education, special needs support, social innovation, capacity building, advocacy and partnerships."}]'::jsonb
   when 'impact' then '[{"type":"heading","text":"Our Impact","level":2},{"type":"paragraph","text":"The figures below are approved by ISNESI leadership and published with sources so you can verify them."}]'::jsonb
   when 'contact' then '[{"type":"heading","text":"Contact Us","level":2},{"type":"paragraph","text":"Reach the ISNESI team by email, phone or through the enquiry form on this page."}]'::jsonb
   when 'programmes' then '[{"type":"heading","text":"Our Programmes","level":2},{"type":"paragraph","text":"Explore the programme areas that guide ISNESI work across Cameroon."}]'::jsonb
   when 'stories' then '[{"type":"heading","text":"Stories & News","level":2},{"type":"paragraph","text":"Read the latest stories, news and announcements from our community."}]'::jsonb
   when 'kids-corner' then '[{"type":"heading","text":"Kids Corner","level":2},{"type":"paragraph","text":"Safe, age-appropriate learning resources for children, reviewed before publication."}]'::jsonb
   when 'donate' then '[{"type":"heading","text":"Donate","level":2},{"type":"paragraph","text":"Your support helps us reach more children and families."}]'::jsonb
   when 'get-involved' then '[{"type":"heading","text":"Get Involved","level":2},{"type":"paragraph","text":"Volunteer, partner or enquire about joining the ISNESI mission."}]'::jsonb
   when 'privacy' then '[{"type":"heading","text":"Privacy Notice","level":2},{"type":"paragraph","text":"ISNESI respects your privacy and handles personal data in line with applicable law."}]'::jsonb
   when 'terms' then '[{"type":"heading","text":"Terms of Service","level":2},{"type":"paragraph","text":"These terms govern your use of the ISNESI website."}]'::jsonb
   when 'accessibility' then '[{"type":"heading","text":"Accessibility Statement","level":2},{"type":"paragraph","text":"ISNESI is committed to an accessible website for everyone, including people with disabilities."}]'::jsonb
   when 'safeguarding' then '[{"type":"heading","text":"Safeguarding Statement","level":2},{"type":"paragraph","text":"ISNESI has safeguarding policies and procedures to protect children and vulnerable adults."}]'::jsonb
   else '[{"type":"heading","text":"Page Not Found","level":2},{"type":"paragraph","text":"The page you are looking for could not be found."}]'::jsonb
  end)
from p;

-- Page sections for key pages
with ps as (
  insert into public.page_sections(page_id,section_key,section_type,sort_order,is_enabled,config)
  select p.id,'hero','hero',1,true,
   jsonb_build_object('heading','Welcome to ISNESI','subheading','Working for children with disabilities across Cameroon.','cta_label','Get Involved','cta_href','/get-involved')
  from public.pages p where p.slug='about'
  returning id
)
select 1;

insert into public.page_sections(page_id,section_key,section_type,sort_order,is_enabled,config)
select p.id,'intro','text',2,true,
 jsonb_build_object('heading','Who we are','text','ISNESI works in partnership with schools, communities, government and NGOs to extend the reach of inclusive practice.')
from public.pages p where p.slug='about'
on conflict do nothing;

-- Categories
with c as (
  insert into public.categories(key)
  values ('education'),('health'),('advocacy'),('community'),('innovation'),('stories')
  returning id, key
)
insert into public.category_translations(category_id,locale,label)
select c.id,'en',
 case c.key
  when 'education' then 'Education'
  when 'health' then 'Health & Wellbeing'
  when 'advocacy' then 'Advocacy & Rights'
  when 'community' then 'Community'
  when 'innovation' then 'Innovation'
  else 'Stories' end
from c
on conflict (category_id,locale) do nothing;

-- Tags
with t as (
  insert into public.tags(key)
  values ('disability'),('inclusion'),('education'),('teachers'),('parents'),('technology'),('policy'),('events')
  returning id, key
)
insert into public.tag_translations(tag_id,locale,label)
select t.id,'en',
 case t.key
  when 'disability' then 'Disability'
  when 'inclusion' then 'Inclusion'
  when 'education' then 'Education'
  when 'teachers' then 'Teachers'
  when 'parents' then 'Parents'
  when 'technology' then 'Technology'
  when 'policy' then 'Policy'
  else 'Events' end
from t
on conflict (tag_id,locale) do nothing;

-- Content items (stories, news, announcements, policies)
with ci as (
  insert into public.content_items(content_type,slug,status,author_id,reviewer_id,published_at,featured,allow_comments)
  values
   ('story','new-inclusive-classrooms-opens-in-yaounde','published',null,null,now() - interval '10 days',true,true),
   ('news','teacher-training-workshop-march','published',null,null,now() - interval '7 days',false,true),
   ('announcement','capacity-building-programme-launch','published',null,null,now() - interval '5 days',false,false),
   ('policy','child-safeguarding-policy-update','published',null,null,now() - interval '3 days',false,false),
   ('story','assistive-device-pilot-success','draft',null,null,null,false,true),
   ('news','community-dialogue-on-disability-rights','in_review',null,null,null,false,true)
  returning id, slug, status
)
insert into public.content_translations(content_id,locale,title,excerpt,body,seo_title,seo_description)
select ci.id,'en',
 case ci.slug
  when 'new-inclusive-classrooms-opens-in-yaounde' then 'New Inclusive Classrooms Open in Yaounde'
  when 'teacher-training-workshop-march' then 'Teacher Training Workshop Held in March'
  when 'capacity-building-programme-launch' then 'Capacity Building Programme Launches'
  when 'child-safeguarding-policy-update' then 'Child Safeguarding Policy Updated'
  when 'assistive-device-pilot-success' then 'Assistive Device Pilot Shows Promise'
  else 'Community Dialogue on Disability Rights' end,
 case ci.slug
  when 'new-inclusive-classrooms-opens-in-yaounde' then 'A new block of inclusive classrooms has opened, welcoming children with disabilities into mainstream education.'
  when 'teacher-training-workshop-march' then 'Twenty teachers completed inclusive practice training in Yaounde last month.'
  when 'capacity-building-programme-launch' then 'ISNESI is launching a new capacity-building programme for schools and communities.'
  when 'child-safeguarding-policy-update' then 'The safeguarding policy has been reviewed and strengthened following consultation.'
  when 'assistive-device-pilot-success' then 'A pilot of low-cost assistive devices has shown promising early results.'
  else 'Community leaders met to discuss disability rights and inclusion.' end,
 jsonb_build_object('blocks',
  case ci.slug
   when 'new-inclusive-classrooms-opens-in-yaounde' then '[{"type":"heading","text":"New Inclusive Classrooms Open in Yaounde","level":2},{"type":"paragraph","text":"ISNESI has opened a new block of inclusive classrooms in Yaounde, designed to welcome children with disabilities into mainstream education alongside their peers."},{"type":"paragraph","text":"The classrooms feature adapted furniture, accessible learning materials and teachers trained in inclusive classroom practice."}]'::jsonb
   when 'teacher-training-workshop-march' then '[{"type":"heading","text":"Teacher Training Workshop Held in March","level":2},{"type":"paragraph","text":"Twenty teachers from across the region completed a three-day inclusive practice workshop organised by ISNESI in March."},{"type":"list","items":["Classroom adaptations","Differentiated instruction","Assistive technology basics"],"ordered":true}]'::jsonb
   when 'capacity-building-programme-launch' then '[{"type":"heading","text":"Capacity Building Programme Launches","level":2},{"type":"paragraph","text":"ISNESI is launching a new capacity-building programme to strengthen teacher and caregiver skills across partner schools."}]'::jsonb
   when 'child-safeguarding-policy-update' then '[{"type":"heading","text":"Child Safeguarding Policy Updated","level":2},{"type":"paragraph","text":"ISNESI has reviewed and strengthened its child safeguarding policy following consultation with staff, partners and communities."}]'::jsonb
   when 'assistive-device-pilot-success' then '[{"type":"heading","text":"Assistive Device Pilot Shows Promise","level":2},{"type":"paragraph","text":"A pilot of low-cost assistive devices has shown promising early results, with devices co-designed with children and families."}]'::jsonb
   else '[{"type":"heading","text":"Community Dialogue on Disability Rights","level":2},{"type":"paragraph","text":"Community leaders, local government representatives and disability advocates met for a dialogue on disability rights and inclusion."}]'::jsonb
  end),
 case ci.slug
  when 'new-inclusive-classrooms-opens-in-yaounde' then 'New Inclusive Classrooms Open in Yaounde | ISNESI'
  when 'teacher-training-workshop-march' then 'Teacher Training Workshop Held in March | ISNESI'
  when 'capacity-building-programme-launch' then 'Capacity Building Programme Launches | ISNESI'
  when 'child-safeguarding-policy-update' then 'Child Safeguarding Policy Updated | ISNESI'
  when 'assistive-device-pilot-success' then 'Assistive Device Pilot Shows Promise | ISNESI'
  else 'Community Dialogue on Disability Rights | ISNESI' end,
 case ci.slug
  when 'new-inclusive-classrooms-opens-in-yaounde' then 'Inclusive classrooms have opened in Yaounde, welcoming children with disabilities into mainstream education.'
  when 'teacher-training-workshop-march' then 'Twenty teachers completed inclusive practice training in Yaounde last month.'
  when 'capacity-building-programme-launch' then 'ISNESI is launching a new capacity-building programme for schools and communities.'
  when 'child-safeguarding-policy-update' then 'The ISNESI child safeguarding policy has been reviewed and strengthened.'
  when 'assistive-device-pilot-success' then 'A pilot of low-cost assistive devices has shown promising early results.'
  else 'Community leaders met to discuss disability rights and inclusion.' end
from ci;

-- Content approvals for published/story items
insert into public.content_approvals(content_id,revision_id,reviewer_id,decision,note,decided_at)
select ci.id, cr.id, '00000000-0000-0000-0000-000000000001'::uuid,'approved','Approved for publication.',cr.created_at
from public.content_items ci
join public.content_revisions cr on cr.content_id = ci.id
where ci.status in ('published','approved')
and cr.revision_no = 1
on conflict do nothing;

-- Content categories and tags
insert into public.content_categories(content_id,category_id)
select ci.id, c.id
from public.content_items ci
join public.categories c on c.key = 'education'
where ci.slug = 'new-inclusive-classrooms-opens-in-yaounde'
on conflict do nothing;

insert into public.content_categories(content_id,category_id)
select ci.id, c.id
from public.content_items ci
join public.categories c on c.key = 'advocacy'
where ci.slug = 'community-dialogue-on-disability-rights'
on conflict do nothing;

insert into public.content_tags(content_id,tag_id)
select ci.id, t.id
from public.content_items ci
join public.tags t on t.key in ('disability','inclusion','education')
where ci.slug = 'new-inclusive-classrooms-opens-in-yaounde'
on conflict do nothing;

insert into public.content_tags(content_id,tag_id)
select ci.id, t.id
from public.content_items ci
join public.tags t on t.key in ('teachers','education')
where ci.slug = 'teacher-training-workshop-march'
on conflict do nothing;

-- Content relationships
insert into public.content_relationships(source_id,target_id,relationship)
select s.id, t.id, 'related'
from public.content_items s
join public.content_items t on t.slug = 'teacher-training-workshop-march'
where s.slug = 'new-inclusive-classrooms-opens-in-yaounde'
on conflict do nothing;

-- Partners
with pr as (
  insert into public.partners(name,relationship_type,website_url,logo_media_id,approval_status,public_visible,approved_by,approved_at)
  values
   ('Ministry of Social Affairs','government','https://minsocial.cm',null,'approved',true,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '60 days'),
   ('Cameroon Baptist Convention','ngo','https://cbchealthservices.org',null,'approved',true,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '45 days'),
   ('UNICEF Cameroon','un_agency','https://unicef.org/cameroon',null,'approved',true,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '30 days'),
   ('Local Innovators Network','community','https://localinnovators.cm',null,'pending',false,null,null),
   ('Tech for All Foundation','foundation','https://techforall.cm',null,'rejected',false,null,null)
  returning id
)
insert into public.partner_translations(partner_id,locale,description)
select pr.id,'en',
 case pr.name
  when 'Ministry of Social Affairs' then 'Government partner supporting inclusive education policy and implementation.'
  when 'Cameroon Baptist Convention' then 'NGO partner delivering health and education services to children with disabilities.'
  when 'UNICEF Cameroon' then 'UN agency partner supporting child rights and inclusive programming.'
  when 'Local Innovators Network' then 'Community network of local innovators developing assistive solutions.'
  else 'Foundation supporting technology access for persons with disabilities.' end
from pr;

-- Media assets
with ma as (
  insert into public.media_assets(bucket_id,object_path,file_name,mime_type,byte_size,width,height,alt_text,caption,credit,rights_status,rights_reference,consent_reference,safeguarding_reviewed,uploaded_by)
  values
   ('public-media','uploads/2026/hero-classroom.jpg','hero-classroom.jpg','image/jpeg',245760,1200,800,'Children in an inclusive classroom','Inclusive classroom in Yaounde','ISNESI','owned','ISNESI-2026-001',null,true,'00000000-0000-0000-0000-000000000001'::uuid),
   ('public-media','uploads/2026/teacher-workshop.jpg','teacher-workshop.jpg','image/png',512000,1600,1200,'Teachers in a training workshop','Teacher training workshop, March 2026','ISNESI','owned','ISNESI-2026-002',null,true,'00000000-0000-0000-0000-000000000001'::uuid),
   ('public-media','uploads/2026/assistive-device.jpg','assistive-device.jpg','image/webp',184320,1000,750,'Low-cost assistive device prototype','Assistive device pilot prototype','ISNESI','licensed','CC-BY-4.0',null,true,'00000000-0000-0000-0000-000000000001'::uuid),
   ('public-media','uploads/2026/partner-logo-unicef.png','partner-logo-unicef.png','image/png',98304,500,500,'UNICEF Cameroon logo','UNICEF partner logo','UNICEF','owned','UNICEF-brand-2026',null,true,'00000000-0000-0000-0000-000000000001'::uuid),
   ('public-media','uploads/2026/kids-storybook.pdf','kids-storybook.pdf','application/pdf',1048576,null,null,'Kids storybook cover','Downloadable storybook for children','ISNESI','owned','ISNESI-2026-003',null,true,'00000000-0000-0000-0000-000000000001'::uuid),
   ('public-media','uploads/2026/pending-asset.jpg','pending-asset.jpg','image/jpeg',51200,800,600,'Pending rights review','Asset awaiting rights clearance','Photographer Name','pending',null,null,false,'00000000-0000-0000-0000-000000000001'::uuid),
   ('public-media','uploads/2026/expired-asset.jpg','expired-asset.jpg','image/jpeg',51200,800,600,'Expired rights asset','Asset with expired usage rights','Stock Provider','expired','license-2025-expired',null,false,'00000000-0000-0000-0000-000000000001'::uuid)
  returning id, object_path
)
insert into public.media_usage(media_id,entity_type,entity_id,usage_role)
select ma.id,'programme',p.id,'featured_image'
from ma join public.programmes p on p.key = 'inclusive-education'
where ma.object_path = 'uploads/2026/hero-classroom.jpg'
on conflict do nothing;

insert into public.media_usage(media_id,entity_type,entity_id,usage_role)
select ma.id,'content_item',ci.id,'inline_image'
from ma join public.content_items ci on ci.slug = 'new-inclusive-classrooms-opens-in-yaounde'
where ma.object_path = 'uploads/2026/teacher-workshop.jpg'
on conflict do nothing;

-- General enquiries
with ge as (
  insert into public.general_enquiries(enquiry_type,full_name,email,phone,message,status,assigned_to,source,consent_to_contact,created_at,updated_at,closed_at)
  values
   ('volunteer','Amina Doumbia','amina@example.cm','+237 6 77 77 77 77','I would like to volunteer with ISNESI. I am a teacher with experience in inclusive education.','triaged','00000000-0000-0000-0000-000000000001'::uuid,'website',true,now() - interval '5 days',now() - interval '2 days',null),
   ('partnership','Jean-Pierre Nkoudou','jp@ngo-partner.cm','+237 6 88 88 88 88','Our organisation would like to explore a partnership with ISNESI on community outreach.','assigned','00000000-0000-0000-0000-000000000001'::uuid,'website',true,now() - interval '3 days',now() - interval '1 day',null),
   ('contact','Grace Mbala','grace@example.cm','+237 6 99 99 99 99','Please send me more information about your programmes for children with disabilities.','new',null,'website',true,now() - interval '1 day',now() - interval '1 day',null),
   ('media','Samuel Essola','s.essola@news.cm','+237 6 11 11 11 11','I am a journalist seeking an interview about ISNESI impact figures.','in_progress',null,'website',true,now() - interval '12 hours',now() - interval '12 hours',null),
   ('other','Anonymous','','','General enquiry about services.','spam',null,'website',false,now() - interval '2 days',now() - interval '2 days',now() - interval '1 day')
  returning id
)
insert into public.enquiry_notes(enquiry_id,author_id,note,created_at)
select ge.id,'00000000-0000-0000-0000-000000000001'::uuid,
 case ge.enquiry_type
  when 'volunteer' then 'Volunteer enquiry received. Teacher with inclusive education experience. Follow up with volunteer coordinator.'
  when 'partnership' then 'Partnership enquiry from local NGO. Assigned to partnerships lead.'
  when 'contact' then 'Information request about programmes. Brochure sent by email.'
  when 'media' then 'Journalist interview request. Being coordinated with communications.'
  else 'Spam enquiry. No consent to contact.' end,
 ge.created_at - interval '1 hour'
from ge;

-- Donation campaigns
with dc as (
  insert into public.donation_campaigns(key,is_active,starts_at,ends_at)
  values
   ('annual-appeal-2026',true,now() - interval '90 days',now() + interval '90 days'),
   ('emergency-response-2026',true,now() - interval '30 days',now() + interval '60 days'),
   ('year-end-giving',false,now() - interval '120 days',now() - interval '30 days')
  returning id
)
insert into public.donation_campaign_translations(campaign_id,locale,title,description)
select dc.id,'en',
 case dc.key
  when 'annual-appeal-2026' then 'Annual Appeal 2026'
  when 'emergency-response-2026' then 'Emergency Response 2026'
  else 'Year-End Giving' end,
 case dc.key
  when 'annual-appeal-2026' then 'Support ISNESI work across Cameroon in 2026.'
  when 'emergency-response-2026' then 'Emergency funds for urgent needs in partner communities.'
  else 'Year-end giving campaign (concluded).' end
from dc;

-- Donations
with dn as (
  insert into public.donations(public_reference,donor_name,donor_email,amount_minor,currency,donation_type,campaign_id,payment_status,provider_key,provider_transaction_id,is_anonymous,receipt_number,paid_at,created_at)
  values
   ('DON-2026-ABCD1234','Marie Kamga','marie@example.cm',50000,'XAF','one_time',(select id from public.donation_campaigns where key='annual-appeal-2026'),'succeeded','mobile_money','MTN-2026-001',false,'RCPT-2026-0001',now() - interval '45 days',now() - interval '45 days'),
   ('DON-2026-EFGH5678','Jean Dupont','jean@example.cm',100000,'XAF','one_time',(select id from public.donation_campaigns where key='emergency-response-2026'),'succeeded','card','CARD-2026-002',false,'RCPT-2026-0002',now() - interval '30 days',now() - interval '30 days'),
   ('DON-2026-IJKL9012','Anonymous Donor',null,25000,'XAF','recurring',(select id from public.donation_campaigns where key='annual-appeal-2026'),'pending',null,null,true,null,null,now() - interval '15 days'),
   ('DON-2026-MNOP3456','Sarah Nkeng','sarah@example.cm',75000,'XAF','one_time',(select id from public.donation_campaigns where key='year-end-giving'),'failed','mobile_money','MTN-2026-003',false,null,null,now() - interval '10 days')
  returning id
)
select 1 from dn;

-- Newsletter subscribers
with ns as (
  insert into public.newsletter_subscribers(email,full_name,status,locale,confirmed_at,unsubscribed_at,created_at)
  values
   ('alice@example.cm','Alice Nkeng','subscribed','en',now() - interval '60 days',null,now() - interval '60 days'),
   ('bob@example.cm','Bob Muna','subscribed','en',now() - interval '45 days',null,now() - interval '45 days'),
   ('carol@example.cm','Carol Essola','pending','en',null,null,now() - interval '7 days'),
   ('david@example.cm','David Tchia','unsubscribed','en',now() - interval '90 days',now() - interval '5 days',now() - interval '90 days'),
   ('eve@example.cm','Eve Fouda','suppressed','fr',null,null,now() - interval '120 days')
  returning id
)
insert into public.newsletter_consents(subscriber_id,status,source,policy_version,recorded_at)
select ns.id,
 case ns.status
  when 'subscribed' then 'granted'
  when 'pending' then 'granted'
  when 'unsubscribed' then 'withdrawn'
  else 'withdrawn' end,
 'website','1.0',
 case ns.status
  when 'subscribed' then now() - interval '60 days'
  when 'pending' then now() - interval '7 days'
  when 'unsubscribed' then now() - interval '5 days'
  else now() - interval '5 days' end
from ns;

-- Newsletter campaigns
insert into public.newsletter_campaigns(name,subject,body,status,scheduled_at,sent_at,created_by,created_at)
values
 ('Welcome Series','Welcome to ISNESI','{"blocks":[{"type":"paragraph","text":"Welcome to the ISNESI community."}]}','sent',now() - interval '50 days',now() - interval '50 days','00000000-0000-0000-0000-000000000001'::uuid,now() - interval '50 days'),
 ('Impact Update Q2','Your Impact This Quarter','{"blocks":[{"type":"paragraph","text":"See the impact figures from Q2."}]}','draft',null,null,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '10 days');

-- Kids resources
with kr as (
  insert into public.kids_resources(resource_type,status,min_age,max_age,is_featured,safeguarding_approved,created_by,created_at,updated_at)
  values
   ('story','published',6,10,true,true,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '40 days',now() - interval '40 days'),
   ('activity','published',8,12,false,true,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '30 days',now() - interval '30 days'),
   ('game','draft',5,9,false,false,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '5 days',now() - interval '5 days'),
   ('video','published',10,14,false,true,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '20 days',now() - interval '20 days'),
   ('download','in_review',6,11,false,false,'00000000-0000-0000-0000-000000000001'::uuid,now() - interval '3 days',now() - interval '3 days')
  returning id
)
insert into public.kids_resource_translations(resource_id,locale,title,description,content)
select kr.id,'en',
 case kr.resource_type
  when 'story' then 'The Inclusive Classroom'
  when 'activity' then 'Build Your Own Communication Board'
  when 'game' then 'Emotion Matching Game'
  when 'video' then 'How Hearing Aids Work'
  else 'Accessible Playground Guide' end,
 case kr.resource_type
  when 'story' then 'A story about a child with a disability joining an inclusive classroom.'
  when 'activity' then 'A hands-on activity to build a picture communication board.'
  when 'game' then 'A game to help children recognise and name emotions.'
  when 'video' then 'An animated video explaining hearing aids for children.'
  else 'A guide to making playgrounds accessible for all children.' end,
 jsonb_build_object('blocks',
  case kr.resource_type
   when 'story' then '[{"type":"paragraph","text":"Every child belongs in the classroom."}]'::jsonb
   when 'activity' then '[{"type":"paragraph","text":"Gather pictures, cardboard and glue to build your board."}]'::jsonb
   when 'game' then '[{"type":"paragraph","text":"Match the face to the feeling."}]'::jsonb
   when 'video' then '[{"type":"paragraph","text":"Watch and learn how hearing aids help."}]'::jsonb
   else '[{"type":"paragraph","text":"Tips for accessible play spaces."}]'::jsonb
  end)
from kr;

-- Impact metrics
insert into public.impact_metrics(key,label,value,unit,currency,description,source_note,evidence_url,reporting_period,sort_order,is_published,approved_at,created_by,updated_by)
values
 ('children-reached','Children reached',1250,'count',null,'Children with disabilities and families reached through ISNESI programmes in 2026.','Programme monitoring and attendance records','https://isnesi.cm/reports/2026','2026',1,true,now() - interval '30 days','00000000-0000-0000-0000-000000000001'::uuid,'00000000-0000-0000-0000-000000000001'::uuid),
 ('teachers-trained','Teachers trained',84,'count',null,'Teachers trained in inclusive classroom practice during 2026.','Training attendance registers','https://isnesi.cm/reports/2026-training','2026',2,true,now() - interval '25 days','00000000-0000-0000-0000-000000000001'::uuid,'00000000-0000-0000-0000-000000000001'::uuid),
 ('classrooms-adapted','Classrooms adapted',12,'count',null,'Mainstream classrooms adapted for inclusive education in partner schools.','School infrastructure audit','https://isnesi.cm/reports/2026-infrastructure','2026',3,true,now() - interval '20 days','00000000-0000-0000-0000-000000000001'::uuid,'00000000-0000-0000-0000-000000000001'::uuid),
 ('funds-raised','Funds raised',15000000,'currency','XAF','Funds raised through donations and grants in 2026.','Finance reconciliation records','https://isnesi.cm/reports/2026-finance','2026',4,true,now() - interval '15 days','00000000-0000-0000-0000-000000000001'::uuid,'00000000-0000-0000-0000-000000000001'::uuid),
 ('illustrative-figure','Illustrative figure (not public)',42,'count',null,'This figure is drafted but not yet approved for publication.','Internal working draft','https://isnesi.cm/internal/draft','2026',5,false,null,'00000000-0000-0000-0000-000000000001'::uuid,'00000000-0000-0000-0000-000000000001'::uuid)
on conflict (key) do nothing;