-- Owner-requested realistic Arabic seeded copy, IDs and all operational state preserved
UPDATE portal_entries SET title='حزمة أدوات المذاكرة', description='دفتر ملاحظات وأقلام للكتابة والتظليل، مجموعة عملية لتنظيم المحاضرات والمراجعة اليومية', location='قنا، منطقة الجامعة', category='أدوات دراسية' WHERE id='review-demo-v1-product' AND demo=true;
UPDATE portal_entries SET title='غرفة مشتركة للطلاب', description='غرفة مفروشة بسريرين ومساحة للمذاكرة، داخل شقة تضم مطبخا وحماما مشتركا، السعر للإيجار الشهري', location='قنا، منطقة الجامعة', category='غرف مشتركة' WHERE id='review-demo-v1-housing' AND demo=true;
UPDATE portal_entries SET title='وجبة دجاج وأرز', description='وجبة دجاج مع أرز وسلطة طازجة، اختيار مناسب لاستراحة الغداء خلال اليوم الجامعي', location='قنا، منطقة الجامعة', category='وجبات' WHERE id='review-demo-v1-restaurant' AND demo=true;
UPDATE portal_entries SET title='تذكرة أمسية موسيقية', description='أمسية موسيقية للطلاب ضمن برنامج الأنشطة الثقافية، تابع تفاصيل الحضور من خلال طلبك', location='قنا', category='فعاليات' WHERE id='review-demo-v1-ticket' AND demo=true;
UPDATE portal_entries SET title='رحلة طلابية إلى الأقصر', description='رحلة ليوم واحد للتعرف على معالم الأقصر مع مجموعة من الطلاب، تابع تفاصيل التجمع والبرنامج من خلال طلبك', location='قنا، الأقصر', category='رحلات اليوم الواحد' WHERE id='review-demo-v1-trip' AND demo=true;
UPDATE portal_entries SET title='ورشة مهارات العرض والتواصل', description='تدريبات عملية على تنظيم الأفكار وتقديم العروض والتواصل داخل فريق العمل', location='قنا', category='تطوير المهارات' WHERE id='review-demo-v1-training' AND demo=true;
UPDATE portal_entries SET title='مجموعة المذاكرة الجامعية', description='مجموعة للمراجعة المشتركة وتبادل الملاحظات وتنظيم جلسات المذاكرة بين الطلاب', location='قنا', category='مجموعات الدراسة' WHERE id='review-demo-v1-team' AND demo=true;
UPDATE portal_entries SET title='فريق تنظيم الأنشطة الطلابية', description='شارك في تنظيم الأنشطة واستقبال الطلاب وتوثيق الفعاليات، اختر القسم الذي يناسب مهاراتك', location='قنا', category='أنشطة طلابية' WHERE id='review-demo-v1-volunteer' AND demo=true;
UPDATE portal_entries SET title='ما موضوع الورشة القادمة؟', description='اختر الموضوع الذي ترغب في تعلمه خلال الورشة القادمة لمساعدة فريق الأنشطة في إعداد البرنامج', location='قنا', category='استبيان طلابي' WHERE id='review-demo-v1-poll' AND demo=true;
UPDATE institutions SET name='مكتبة الطالب', description='أدوات الدراسة واحتياجات الحياة الجامعية في مكان واحد' WHERE id='review-demo-store' AND demo=true;
UPDATE institutions SET name='ملتقى الأنشطة الطلابية', description='ورش وأنشطة ومجموعات تعلم للطلاب' WHERE id='review-demo-services' AND demo=true;
UPDATE volunteer_divisions SET label='التنظيم', description='تنسيق الأنشطة واستقبال المشاركين ومتابعة البرنامج' WHERE id='review-demo-v1-volunteer-organization';
UPDATE volunteer_divisions SET label='الإعلام', description='إعداد المحتوى وتوثيق الأنشطة ومشاركة أخبار الفريق' WHERE id='review-demo-v1-volunteer-media';
UPDATE poll_options SET label='مهارات الدراسة' WHERE id='review-demo-v1-poll-0';
UPDATE poll_options SET label='البرمجة' WHERE id='review-demo-v1-poll-1';
UPDATE poll_options SET label='التواصل' WHERE id='review-demo-v1-poll-2';
