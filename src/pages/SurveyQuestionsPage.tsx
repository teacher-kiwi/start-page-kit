import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { ChevronRight, ArrowLeft } from "lucide-react"

interface Question {
  id: string
  question_text: string
  polarity: string
}

interface Student {
  id: string
  name: string
  photo_url?: string
  student_number?: number
}

interface Response {
  question_id: string
  target_id: string
}

const SurveyQuestionsPage = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Response[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const respondentId = localStorage.getItem('selected_student_id')

  useEffect(() => {
    if (!respondentId) {
      alert('학생 정보가 없습니다.')
      navigate('/')
      return
    }

    loadData()
  }, [respondentId, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 문항들 가져오기
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions' as any)
        .select('*')
        .order('created_at', { ascending: true })

      if (questionsError) {
        console.error('Error loading questions:', questionsError)
        alert('문항을 불러오는 중 오류가 발생했습니다.')
        return
      }

      // 응답자 학생의 정보로 같은 학급 학생들 가져오기
      const { data: respondentData, error: respondentError } = await supabase
        .from('students')
        .select('classroom_id')
        .eq('id', respondentId)
        .single()

      if (respondentError || !respondentData) {
        console.error('Error loading respondent:', respondentError)
        alert('응답자 정보를 찾을 수 없습니다.')
        return
      }

      // 같은 학급의 다른 학생들 가져오기
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, photo_url, student_number')
        .eq('classroom_id', respondentData.classroom_id)
        .neq('id', respondentId) // 본인 제외
        .order('student_number', { ascending: true })

      if (studentsError) {
        console.error('Error loading students:', studentsError)
        alert('학생 목록을 불러오는 중 오류가 발생했습니다.')
        return
      }

      setQuestions((questionsData as unknown as Question[]) || [])
      setStudents(studentsData || [])
    } catch (error) {
      console.error('Error:', error)
      alert('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId)
  }

  const handleNext = () => {
    if (!selectedStudentId) {
      alert('친구를 선택해주세요.')
      return
    }

    // 현재 응답 저장
    const newResponse: Response = {
      question_id: questions[currentQuestionIndex].id,
      target_id: selectedStudentId
    }

    const updatedResponses = [...responses]
    const existingIndex = updatedResponses.findIndex(r => r.question_id === questions[currentQuestionIndex].id)
    
    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newResponse
    } else {
      updatedResponses.push(newResponse)
    }
    
    setResponses(updatedResponses)

    // 다음 문항으로 이동하거나 완료
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedStudentId("")
    } else {
      // 모든 문항 완료 - 결과 저장
      submitResponses(updatedResponses)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      // 이전 응답이 있다면 복원
      const prevResponse = responses.find(r => r.question_id === questions[currentQuestionIndex - 1].id)
      setSelectedStudentId(prevResponse?.target_id || "")
    }
  }

  const submitResponses = async (finalResponses: Response[]) => {
    try {
      setSubmitting(true)
      
      console.log('Submitting responses:', finalResponses)
      console.log('Respondent ID:', respondentId)

      // 1. relationship_responses 테이블에 응답 정보 저장
      const responsesToSave = finalResponses.map(response => ({
        survey_id: null, // 현재는 설문 ID가 없으므로 null로 설정
        survey_question_id: null, // 현재는 survey_questions가 아닌 직접 questions를 사용
        respondent_id: respondentId
      }))

      console.log('Data to save:', responsesToSave)

      const { data: savedResponses, error: responseError } = await supabase
        .from('relationship_responses')
        .insert(responsesToSave)
        .select('id')

      if (responseError) {
        console.error('Error saving responses:', responseError)
        alert('응답 저장 중 오류가 발생했습니다.')
        return
      }

      // 2. relationship_response_targets 테이블에 선택된 학생 정보 저장
      const targetsToSave = finalResponses.map((response, index) => ({
        response_id: savedResponses[index].id,
        target_id: response.target_id,
        extra_value: 0 // 기본값
      }))

      const { error: targetError } = await supabase
        .from('relationship_response_targets')
        .insert(targetsToSave)

      if (targetError) {
        console.error('Error saving targets:', targetError)
        alert('응답 대상 저장 중 오류가 발생했습니다.')
        return
      }

      // 완료 처리
      alert('설문이 완료되었습니다!')
      localStorage.removeItem('selected_student_id')
      navigate('/')
      
    } catch (error) {
      console.error('Error submitting responses:', error)
      alert('응답 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
       <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">설문을 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">설문 문항이 없습니다.</p>
          <Button onClick={() => navigate('/')}>
            처음으로 돌아가기
          </Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* 상단 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 문항 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {currentQuestionIndex + 1}. {currentQuestion.question_text}
          </h1>
        </div>

        {/* 학생 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-8">
          {students.map((student, index) => (
            <Card 
              key={student.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedStudentId === student.id
                  ? 'border-4 border-orange-400 bg-orange-50 shadow-lg'
                  : 'border-2 border-orange-200 bg-gradient-to-b from-yellow-100 to-orange-100 hover:border-orange-300'
              }`}
              onClick={() => handleStudentSelect(student.id)}
            >
              <div className="text-center space-y-3">
                {/* 학생 사진 */}
                <div className="w-20 h-24 mx-auto bg-gray-100 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                  {student.photo_url ? (
                    <img 
                      src={student.photo_url} 
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-2xl text-gray-500">👤</span>
                    </div>
                  )}
                </div>
                
                {/* 번호와 이름 */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {student.student_number || index + 1}번 {student.name}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            이전
          </Button>

          <Button
            onClick={handleNext}
            disabled={!selectedStudentId || submitting}
            className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white"
          >
            {submitting ? (
              '제출 중...'
            ) : currentQuestionIndex === questions.length - 1 ? (
              '완료'
            ) : (
              <>
                다음
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SurveyQuestionsPage