import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { ChevronRight, ArrowLeft } from "lucide-react"

interface Question {
  id: string
  question_text: string
}

interface Student {
  id: string
  name: string
  photo_url?: string
  student_number?: number
}

interface Response {
  question_id: string
  target_ids: string[]
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
  const location = useLocation()

  // ✅ URL 쿼리스트링에서 token 가져오기
  const searchParams = new URLSearchParams(location.search)
  const surveyToken = searchParams.get("token")
  const respondentId = localStorage.getItem("selected_student_id")

  useEffect(() => {
    if (!respondentId || !surveyToken) {
      alert("유효하지 않은 접근입니다.")
      navigate("/")
      return
    }
    loadDataWithToken(surveyToken)
  }, [respondentId, surveyToken, navigate])

  const loadDataWithToken = async (token: string) => {
    try {
      setLoading(true)
      const { data: surveyData, error: surveyError } = await supabase.functions.invoke(
        "get-survey-data",
        { body: { token } }
      )

      if (surveyError || !surveyData || surveyData.error) {
        console.error("Survey data loading failed:", surveyError || surveyData?.error)
        alert("유효하지 않은 설문입니다.")
        navigate("/")
        return
      }

      const filteredStudents = surveyData.students.filter((s: any) => s.id !== respondentId)

      setQuestions(surveyData.questions || [])
      setStudents(filteredStudents || [])
    } catch (error) {
      console.error("Error:", error)
      alert("데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId)
  }

  const handleNext = () => {
    if (!selectedStudentId) {
      alert("친구를 선택해주세요.")
      return
    }

    const newResponse: Response = {
      question_id: questions[currentQuestionIndex].id,
      target_ids: [selectedStudentId],
    }

    const updatedResponses = [...responses]
    const existingIndex = updatedResponses.findIndex(
      (r) => r.question_id === questions[currentQuestionIndex].id
    )

    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newResponse
    } else {
      updatedResponses.push(newResponse)
    }

    setResponses(updatedResponses)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedStudentId("")
    } else {
      submitResponses(updatedResponses)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      const prevResponse = responses.find(
        (r) => r.question_id === questions[currentQuestionIndex - 1].id
      )
      setSelectedStudentId(prevResponse?.target_ids?.[0] || "")
    }
  }

  const submitResponses = async (finalResponses: Response[]) => {
    try {
      setSubmitting(true)
      const { data, error } = await supabase.functions.invoke("submit-survey-response", {
        body: {
          token: surveyToken,
          respondent_id: respondentId,
          responses: finalResponses,
        },
      })

      if (error || data?.error) {
        console.error("Error submitting responses:", error || data?.error)
        alert("응답 제출 중 오류가 발생했습니다.")
        return
      }

      alert("설문이 완료되었습니다!")
      localStorage.removeItem("selected_student_id")
      navigate("/")
    } catch (error) {
      console.error("Error submitting responses:", error)
      alert("응답 제출 중 오류가 발생했습니다.")
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
          <Button onClick={() => navigate("/")}>처음으로 돌아가기</Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
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

        {/* 학생 선택 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-8">
          {students.map((student, index) => (
            <Card
              key={student.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedStudentId === student.id
                  ? "border-4 border-orange-400 bg-orange-50 shadow-lg"
                  : "border-2 border-orange-200 bg-gradient-to-b from-yellow-100 to-orange-100 hover:border-orange-300"
              }`}
              onClick={() => handleStudentSelect(student.id)}
            >
              <div className="text-center space-y-3">
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
                <p className="text-sm font-semibold text-gray-800">
                  {student.student_number || index + 1}번 {student.name}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* 버튼 */}
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
            {submitting
              ? "제출 중..."
              : currentQuestionIndex === questions.length - 1
              ? "완료"
              : (
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
