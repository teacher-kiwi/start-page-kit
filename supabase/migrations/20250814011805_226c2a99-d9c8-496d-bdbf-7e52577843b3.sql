-- 1. Create surveys table for managing survey rounds
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('Asia/Seoul'::text, now()),
  is_active BOOLEAN DEFAULT true
);

-- 2. Create survey_questions table for round-specific question configuration
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  weight NUMERIC DEFAULT 1,
  order_num INTEGER,
  polarity TEXT CHECK (polarity IN ('positive', 'negative')),
  created_at TIMESTAMPTZ DEFAULT timezone('Asia/Seoul'::text, now())
);

-- 3. Drop existing relationship_responses table and recreate as response header
DROP TABLE IF EXISTS relationship_responses CASCADE;

CREATE TABLE relationship_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  survey_question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('Asia/Seoul'::text, now())
);

-- 4. Create relationship_response_targets table for response target mapping
CREATE TABLE relationship_response_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES relationship_responses(id) ON DELETE CASCADE,
  target_id UUID REFERENCES students(id) ON DELETE CASCADE,
  extra_value NUMERIC
);

-- Create indexes for optimization
CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id);
CREATE INDEX idx_relationship_responses_survey ON relationship_responses(survey_id);
CREATE INDEX idx_relationship_response_targets_response ON relationship_response_targets(response_id);

-- Enable RLS on new tables
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_response_targets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for surveys table
CREATE POLICY "Teachers can view own surveys" ON surveys
  FOR SELECT USING (
    classroom_id IN (
      SELECT id FROM classrooms 
      WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
    )
  );

CREATE POLICY "Teachers can insert own surveys" ON surveys
  FOR INSERT WITH CHECK (
    classroom_id IN (
      SELECT id FROM classrooms 
      WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
    )
  );

CREATE POLICY "Teachers can update own surveys" ON surveys
  FOR UPDATE USING (
    classroom_id IN (
      SELECT id FROM classrooms 
      WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
    )
  );

CREATE POLICY "Teachers can delete own surveys" ON surveys
  FOR DELETE USING (
    classroom_id IN (
      SELECT id FROM classrooms 
      WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
    )
  );

-- Create RLS policies for survey_questions table
CREATE POLICY "Teachers can view own survey questions" ON survey_questions
  FOR SELECT USING (
    survey_id IN (
      SELECT id FROM surveys s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can insert own survey questions" ON survey_questions
  FOR INSERT WITH CHECK (
    survey_id IN (
      SELECT id FROM surveys s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can update own survey questions" ON survey_questions
  FOR UPDATE USING (
    survey_id IN (
      SELECT id FROM surveys s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can delete own survey questions" ON survey_questions
  FOR DELETE USING (
    survey_id IN (
      SELECT id FROM surveys s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

-- Create RLS policies for relationship_responses table
CREATE POLICY "Teachers can view responses for their students" ON relationship_responses
  FOR SELECT USING (
    respondent_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can insert responses for their students" ON relationship_responses
  FOR INSERT WITH CHECK (
    respondent_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can update responses for their students" ON relationship_responses
  FOR UPDATE USING (
    respondent_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can delete responses for their students" ON relationship_responses
  FOR DELETE USING (
    respondent_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

-- Create RLS policies for relationship_response_targets table
CREATE POLICY "Teachers can view response targets for their students" ON relationship_response_targets
  FOR SELECT USING (
    target_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can insert response targets for their students" ON relationship_response_targets
  FOR INSERT WITH CHECK (
    target_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can update response targets for their students" ON relationship_response_targets
  FOR UPDATE USING (
    target_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );

CREATE POLICY "Teachers can delete response targets for their students" ON relationship_response_targets
  FOR DELETE USING (
    target_id IN (
      SELECT id FROM students s
      WHERE s.classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid() OR teacher_name = get_current_teacher_name()
      )
    )
  );