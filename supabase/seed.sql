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
