-- Safe reference data only. No real users, children, donors or contact records.
insert into public.site_settings(key,value,is_public) values
 ('organisation', '{"name":"ISNESI","tagline":"We Leave No Child Behind."}', true),
 ('locales', '{"default":"en","enabled":["en","fr"]}', true),
 ('donation', '{"currency":"XAF","enabled":false}', true)
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

-- Programme detail content (spec 2.3): structured fields plus a short rich body
-- so the public programme pages render real content after `supabase db reset`.
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
