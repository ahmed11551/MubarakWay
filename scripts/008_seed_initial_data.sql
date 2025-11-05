-- Seed initial partner funds
insert into public.funds (name, name_ar, description, description_ar, category, is_verified, is_active, logo_url) values
  ('Islamic Relief', 'الإغاثة الإسلامية', 'Providing humanitarian aid worldwide', 'تقديم المساعدات الإنسانية في جميع أنحاء العالم', 'general', true, true, '/placeholder.svg?height=100&width=100'),
  ('Orphan Care Foundation', 'مؤسسة رعاية الأيتام', 'Supporting orphans and vulnerable children', 'دعم الأيتام والأطفال المحتاجين', 'orphans', true, true, '/placeholder.svg?height=100&width=100'),
  ('Water for Life', 'الماء للحياة', 'Building wells and water systems in need', 'بناء الآبار وأنظمة المياه للمحتاجين', 'water', true, true, '/placeholder.svg?height=100&width=100'),
  ('Education First', 'التعليم أولاً', 'Providing education to underprivileged communities', 'توفير التعليم للمجتمعات المحرومة', 'education', true, true, '/placeholder.svg?height=100&width=100'),
  ('Medical Aid Network', 'شبكة المساعدات الطبية', 'Healthcare services for those in need', 'خدمات الرعاية الصحية للمحتاجين', 'healthcare', true, true, '/placeholder.svg?height=100&width=100'),
  ('Emergency Relief Fund', 'صندوق الإغاثة الطارئة', 'Rapid response to disasters and emergencies', 'الاستجابة السريعة للكوارث والطوارئ', 'emergency', true, true, '/placeholder.svg?height=100&width=100');
