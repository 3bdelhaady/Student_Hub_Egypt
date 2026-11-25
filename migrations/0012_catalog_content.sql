INSERT INTO universities (id,name,city) VALUES ('demo-university','جامعة قنا الأهلية','قنا') ON CONFLICT (id) DO NOTHING;
UPDATE universities SET name='جامعة قنا الأهلية',city='قنا' WHERE id='demo-university';
INSERT INTO universities (id,name,city) VALUES ('luxor-national','جامعة الأقصر الأهلية','طيبة الجديدة، الأقصر') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('demo-computing','demo-university','كلية الحاسبات والذكاء الاصطناعي') ON CONFLICT (id) DO NOTHING;
UPDATE faculties SET university_id='demo-university',name='كلية الحاسبات والذكاء الاصطناعي' WHERE id='demo-computing';
INSERT INTO faculties (id,university_id,name) VALUES ('demo-engineering','demo-university','كلية الهندسة') ON CONFLICT (id) DO NOTHING;
UPDATE faculties SET university_id='demo-university',name='كلية الهندسة' WHERE id='demo-engineering';
INSERT INTO faculties (id,university_id,name) VALUES ('qena-medicine','demo-university','كلية الطب') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('qena-pharmacy','demo-university','كلية الصيدلة') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('qena-physiotherapy','demo-university','كلية العلاج الطبيعي') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('qena-nursing','demo-university','كلية التمريض') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('qena-languages','demo-university','كلية الألسن') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('demo-commerce','demo-university','كلية العلوم الإدارية والمالية') ON CONFLICT (id) DO NOTHING;
UPDATE faculties SET university_id='demo-university',name='كلية العلوم الإدارية والمالية' WHERE id='demo-commerce';
INSERT INTO faculties (id,university_id,name) VALUES ('luxor-computing','luxor-national','كلية الحاسبات والمعلومات والذكاء الاصطناعي') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('luxor-tourism','luxor-national','كلية السياحة والآثار') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('luxor-languages','luxor-national','كلية اللغات والترجمة والعلوم الإنسانية') ON CONFLICT (id) DO NOTHING;
INSERT INTO faculties (id,university_id,name) VALUES ('luxor-arts','luxor-national','كلية الفنون والتصميم') ON CONFLICT (id) DO NOTHING;
INSERT INTO institutions (id,university_id,name,kind,description,website,demo) VALUES ('demo-institution','demo-university','جامعة قنا الأهلية','university','مساحة مجتمع طلاب جامعة قنا الأهلية على Student Hub.','https://www.svnu.edu.eg',false) ON CONFLICT (id) DO NOTHING;
UPDATE institutions SET university_id='demo-university',name='جامعة قنا الأهلية',kind='university',description='مساحة مجتمع طلاب جامعة قنا الأهلية على Student Hub.',website='https://www.svnu.edu.eg',demo=false WHERE id='demo-institution';
INSERT INTO institutions (id,university_id,name,kind,description,website,demo) VALUES ('luxor-institution','luxor-national','جامعة الأقصر الأهلية','university','مساحة مجتمع طلاب جامعة الأقصر الأهلية على Student Hub.','https://lnu.edu.eg/home/',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO institutions (id,name,kind,description,demo) VALUES ('demo-library','مصادر التعلم','private_sector','محتوى تعليمي ومراجع للمذاكرة وتنظيم المعرفة.',false) ON CONFLICT (id) DO NOTHING;
UPDATE institutions SET name='مصادر التعلم',kind='private_sector',description='محتوى تعليمي ومراجع للمذاكرة وتنظيم المعرفة.',demo=false WHERE id='demo-library';
INSERT INTO institutions (id,name,kind,description,demo) VALUES ('demo-training','التطوير المهني','private_sector','مقالات ومهارات للتعلم والعمل وبناء المسار المهني.',false) ON CONFLICT (id) DO NOTHING;
UPDATE institutions SET name='التطوير المهني',kind='private_sector',description='مقالات ومهارات للتعلم والعمل وبناء المسار المهني.',demo=false WHERE id='demo-training';
INSERT INTO student_organizations (id,institution_id,university_id,faculty_id,kind,name) VALUES ('demo-union-computing','demo-institution','demo-university','demo-computing','student_union','اتحاد طلاب الحاسبات') ON CONFLICT (id) DO NOTHING;
UPDATE student_organizations SET institution_id='demo-institution',university_id='demo-university',faculty_id='demo-computing',kind='student_union',name='اتحاد طلاب الحاسبات' WHERE id='demo-union-computing';
INSERT INTO student_organizations (id,institution_id,university_id,faculty_id,kind,name) VALUES ('demo-activity-computing','demo-institution','demo-university','demo-computing','student_activity','نادي الابتكار الطلابي') ON CONFLICT (id) DO NOTHING;
UPDATE student_organizations SET institution_id='demo-institution',university_id='demo-university',faculty_id='demo-computing',kind='student_activity',name='نادي الابتكار الطلابي' WHERE id='demo-activity-computing';
INSERT INTO courses (id,university_id,title,description,category,instructor,published) VALUES ('math-2','demo-university','الرياضيات ٢','المعادلات التفاضلية والجبر الخطي، من المفاهيم الأساسية إلى حل المسائل.','العلوم الأساسية','فريق المحتوى',true) ON CONFLICT (id) DO NOTHING;
UPDATE courses SET university_id='demo-university',title='الرياضيات ٢',description='المعادلات التفاضلية والجبر الخطي، من المفاهيم الأساسية إلى حل المسائل.',category='العلوم الأساسية',instructor='فريق المحتوى',published=true WHERE id='math-2';
INSERT INTO courses (id,university_id,title,description,category,instructor,published) VALUES ('programming','demo-university','أساسيات البرمجة','تعلّم التفكير المنطقي والخوارزميات والمدخلات والمخرجات وبناء برامج صغيرة.','علوم الحاسب','فريق المحتوى',true) ON CONFLICT (id) DO NOTHING;
UPDATE courses SET university_id='demo-university',title='أساسيات البرمجة',description='تعلّم التفكير المنطقي والخوارزميات والمدخلات والمخرجات وبناء برامج صغيرة.',category='علوم الحاسب',instructor='فريق المحتوى',published=true WHERE id='programming';
INSERT INTO courses (id,university_id,title,description,category,instructor,published) VALUES ('communication','demo-university','مهارات التواصل','نظّم أفكارك وقدّمها بوضوح، وطوّر مهارات العرض والعمل الجماعي.','تطوير المهارات','فريق المحتوى',true) ON CONFLICT (id) DO NOTHING;
UPDATE courses SET university_id='demo-university',title='مهارات التواصل',description='نظّم أفكارك وقدّمها بوضوح، وطوّر مهارات العرض والعمل الجماعي.',category='تطوير المهارات',instructor='فريق المحتوى',published=true WHERE id='communication';
INSERT INTO resources (id,course_id,title,kind,body,position) VALUES ('math-intro','math-2','المحاضرة الأولى: مقدمة في المعادلات التفاضلية','lecture','المعادلة التفاضلية تربط دالة بمشتقاتها. رتبة المعادلة هي أعلى رتبة مشتقة تظهر فيها.

مثال: dy/dx = 2x معادلة من الرتبة الأولى. بالتكامل نحصل على y = x² + C. ثابت التكامل C يتحدد إذا عُرفت قيمة ابتدائية للدالة.

تدريب: تحقق بالتعويض أن y = Ceˣ يحل المعادلة dy/dx = y. ثم أوجد C عندما y(0) = 3.',1) ON CONFLICT (id) DO NOTHING;
UPDATE resources SET course_id='math-2',title='المحاضرة الأولى: مقدمة في المعادلات التفاضلية',kind='lecture',body='المعادلة التفاضلية تربط دالة بمشتقاتها. رتبة المعادلة هي أعلى رتبة مشتقة تظهر فيها.

مثال: dy/dx = 2x معادلة من الرتبة الأولى. بالتكامل نحصل على y = x² + C. ثابت التكامل C يتحدد إذا عُرفت قيمة ابتدائية للدالة.

تدريب: تحقق بالتعويض أن y = Ceˣ يحل المعادلة dy/dx = y. ثم أوجد C عندما y(0) = 3.',position=1 WHERE id='math-intro';
INSERT INTO resources (id,course_id,title,kind,body,position) VALUES ('math-notes','math-2','ملخص المراجعة الأولى','file','راجع قواعد الاشتقاق والتكامل قبل البدء.

اشتقاق xⁿ يساوي nxⁿ⁻¹. وتكامل xⁿ يساوي xⁿ⁺¹/(n+1) + C عندما n لا يساوي -1.

في فصل المتغيرات، اجمع حدود المتغير التابع مع تفاضله في طرف، وحدود المتغير المستقل في الطرف الآخر، ثم كامل الطرفين. لا تنس فحص الحلول الثابتة التي قد تُفقد عند القسمة.',2) ON CONFLICT (id) DO NOTHING;
UPDATE resources SET course_id='math-2',title='ملخص المراجعة الأولى',kind='file',body='راجع قواعد الاشتقاق والتكامل قبل البدء.

اشتقاق xⁿ يساوي nxⁿ⁻¹. وتكامل xⁿ يساوي xⁿ⁺¹/(n+1) + C عندما n لا يساوي -1.

في فصل المتغيرات، اجمع حدود المتغير التابع مع تفاضله في طرف، وحدود المتغير المستقل في الطرف الآخر، ثم كامل الطرفين. لا تنس فحص الحلول الثابتة التي قد تُفقد عند القسمة.',position=2 WHERE id='math-notes';
INSERT INTO resources (id,course_id,title,kind,body,position) VALUES ('code-intro','programming','المحاضرة الأولى: التفكير كالمبرمج','lecture','ابدأ بتحديد المشكلة والمدخلات والمخرجات المطلوبة.

لحساب متوسط ثلاث درجات: اقرأ a وb وc، احسب المجموع s = a + b + c، ثم اطبع s / 3.

جرّب حالات مختلفة: ثلاث درجات متساوية، درجة صفر، ودرجات عشرية. اكتب توقعك قبل تشغيل البرنامج ثم قارنه بالنتيجة.',1) ON CONFLICT (id) DO NOTHING;
UPDATE resources SET course_id='programming',title='المحاضرة الأولى: التفكير كالمبرمج',kind='lecture',body='ابدأ بتحديد المشكلة والمدخلات والمخرجات المطلوبة.

لحساب متوسط ثلاث درجات: اقرأ a وb وc، احسب المجموع s = a + b + c، ثم اطبع s / 3.

جرّب حالات مختلفة: ثلاث درجات متساوية، درجة صفر، ودرجات عشرية. اكتب توقعك قبل تشغيل البرنامج ثم قارنه بالنتيجة.',position=1 WHERE id='code-intro';
INSERT INTO resources (id,course_id,title,kind,body,position) VALUES ('comm-intro','communication','المحاضرة الأولى: الفكرة الواضحة','lecture','حدد فكرة واحدة تريد أن يتذكرها المستمع. ابدأ بها، وادعمها بمثال، ثم اختم بخطوة عملية.

قبل العرض، اسأل نفسك: من الجمهور؟ ما معرفته الحالية؟ وما القرار أو الفهم الذي أريده بعد العرض؟

تدريب: اشرح مشروعك الدراسي في دقيقة واحدة لزميل من تخصص آخر، واطلب منه أن يعيد الفكرة بكلماته.',1) ON CONFLICT (id) DO NOTHING;
UPDATE resources SET course_id='communication',title='المحاضرة الأولى: الفكرة الواضحة',kind='lecture',body='حدد فكرة واحدة تريد أن يتذكرها المستمع. ابدأ بها، وادعمها بمثال، ثم اختم بخطوة عملية.

قبل العرض، اسأل نفسك: من الجمهور؟ ما معرفته الحالية؟ وما القرار أو الفهم الذي أريده بعد العرض؟

تدريب: اشرح مشروعك الدراسي في دقيقة واحدة لزميل من تخصص آخر، واطلب منه أن يعيد الفكرة بكلماته.',position=1 WHERE id='comm-intro';
INSERT INTO posts (id,university_id,title,excerpt,body,kind,category,published) VALUES ('welcome','demo-university','مساحة واحدة لكل ما يهمك في الجامعة','نظّم مقرراتك وتابع تقدمك، وابدأ من مجتمعك الجامعي.','ابدأ بإنشاء حساب واختيار الجامعة والكلية، ثم تابع حالة طلب عضويتك من حسابك.

بعد التفعيل، افتح المقررات المتاحة، واحفظ ما تريد الرجوع إليه. حدد الموارد المكتملة لتتابع تقدمك خطوة بخطوة.','news','دليل المنصة',true) ON CONFLICT (id) DO NOTHING;
UPDATE posts SET university_id='demo-university',title='مساحة واحدة لكل ما يهمك في الجامعة',excerpt='نظّم مقرراتك وتابع تقدمك، وابدأ من مجتمعك الجامعي.',body='ابدأ بإنشاء حساب واختيار الجامعة والكلية، ثم تابع حالة طلب عضويتك من حسابك.

بعد التفعيل، افتح المقررات المتاحة، واحفظ ما تريد الرجوع إليه. حدد الموارد المكتملة لتتابع تقدمك خطوة بخطوة.',kind='news',category='دليل المنصة',published=true WHERE id='welcome';
INSERT INTO posts (id,university_id,title,excerpt,body,kind,category,published) VALUES ('design-workshop','demo-university','من الفكرة إلى أول تصميم','دليل عملي لتحديد المشكلة ورسم أول تصور لحلها.','ابدأ بمشكلة محددة يواجهها مستخدم حقيقي. اسأله عما يحاول فعله وما يعرقله، ثم اكتب الهدف في جملة واحدة.

ارسم ثلاث أفكار على الورق قبل استخدام أي أداة. اختر أبسطها، واعرضها على شخص آخر دون شرح مطول. راقب أين يتوقف، ثم حسّن التصميم.','news','التصميم والتعلم',true) ON CONFLICT (id) DO NOTHING;
UPDATE posts SET university_id='demo-university',title='من الفكرة إلى أول تصميم',excerpt='دليل عملي لتحديد المشكلة ورسم أول تصور لحلها.',body='ابدأ بمشكلة محددة يواجهها مستخدم حقيقي. اسأله عما يحاول فعله وما يعرقله، ثم اكتب الهدف في جملة واحدة.

ارسم ثلاث أفكار على الورق قبل استخدام أي أداة. اختر أبسطها، واعرضها على شخص آخر دون شرح مطول. راقب أين يتوقف، ثم حسّن التصميم.',kind='news',category='التصميم والتعلم',published=true WHERE id='design-workshop';
INSERT INTO posts (id,university_id,title,excerpt,body,kind,category,published) VALUES ('volunteer','demo-university','العمل الجماعي: اتفاق واضح من البداية','كيف توزّع المهام وتتابع تقدم فريقك في مشروع دراسي.','حددوا نتيجة قابلة للقياس، ثم قسّموا العمل إلى مهام صغيرة. لكل مهمة مسؤول وموعد متفق عليه.

اتفقوا على طريقة مشاركة الملفات وتسمية النسخ. في كل متابعة قصيرة، ناقشوا ما تم وما تعطل والخطوة التالية. احتفظوا بالقرارات في مكان واحد.','news','مهارات الفريق',true) ON CONFLICT (id) DO NOTHING;
UPDATE posts SET university_id='demo-university',title='العمل الجماعي: اتفاق واضح من البداية',excerpt='كيف توزّع المهام وتتابع تقدم فريقك في مشروع دراسي.',body='حددوا نتيجة قابلة للقياس، ثم قسّموا العمل إلى مهام صغيرة. لكل مهمة مسؤول وموعد متفق عليه.

اتفقوا على طريقة مشاركة الملفات وتسمية النسخ. في كل متابعة قصيرة، ناقشوا ما تم وما تعطل والخطوة التالية. احتفظوا بالقرارات في مكان واحد.',kind='news',category='مهارات الفريق',published=true WHERE id='volunteer';
UPDATE faculties SET active=false WHERE id IN ('demo-science','demo-arts');
UPDATE memberships SET faculty=f.name FROM faculties f WHERE memberships.faculty_id=f.id AND memberships.university_id=f.university_id;
UPDATE institution_content SET published=false WHERE id IN ('demo-affairs-notice','demo-welfare-notice','demo-union-notice','demo-activity-notice','demo-private-notice');
UPDATE "user" SET name='حساب الطالب' WHERE email='demo.student@studenthub.test' AND name='طالب تجريبي';
UPDATE "user" SET name='وكيل شؤون الطلاب' WHERE email='demo.agent@studenthub.test' AND name='وكيل شؤون الطلاب التجريبي';
UPDATE "user" SET name='مسؤول المنصة' WHERE email='demo.admin@studenthub.test' AND name='أدمن المنصة التجريبي';
UPDATE institution_content SET body='تنظيم المستندات ومتابعة طلبات العضوية يساعدان على إتمام الإجراءات بوضوح. راجع بياناتك الأكاديمية قبل إرسال الطلب، وتابع حالته من حسابك. احتفظ بنسخة من أي مستند تقدمه عبر القنوات المعتمدة لدى جامعتك.' WHERE id='demo-affairs-notice';
UPDATE institution_content SET body='المشاركة في الأنشطة فرصة لاكتساب مهارات جديدة والعمل ضمن فريق. حدد اهتماماتك والوقت الذي تستطيع تخصيصه، وراجع تفاصيل النشاط مع الجهة المنظمة قبل المشاركة.' WHERE id='demo-welfare-notice';
UPDATE institution_content SET body='يقوم العمل الطلابي على تمثيل احتياجات الزملاء ومناقشة المقترحات بوضوح. اكتب فكرتك والهدف منها والخطوات اللازمة لتنفيذها، ثم ناقشها مع مسؤولي المجتمع.' WHERE id='demo-union-notice';
UPDATE institution_content SET body='ابدأ بفكرة صغيرة قابلة للتنفيذ، وشكّل فريقًا يوزّع المسؤوليات بوضوح. حدد هدفًا وموعدًا للمراجعة، ووثّق ما تعلمه الفريق في كل مرحلة.' WHERE id='demo-activity-notice';
UPDATE institution_content SET body='اجمع مراجعك الدراسية في قائمة منظمة، وتحقق من المؤلف وتاريخ النشر ومصدر المادة. اربط كل مرجع بموضوعه لتسهيل العودة إليه أثناء المذاكرة.' WHERE id='demo-private-notice';
