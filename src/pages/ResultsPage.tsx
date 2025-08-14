import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { ArrowLeft } from "lucide-react"

interface Student {
  id: string
  name: string
  photo_url?: string
  student_number?: number
}

interface Question {
  id: string
  question_text: string
  polarity: string
}

interface Response {
  id: string
  question_id: string
  respondent_id: string
  target_id: string
  question?: Question
  target_student?: Student
}

interface StudentResult {
  student: Student
  responses: Response[]
}

interface Classroom {
  id: string
  school_name: string
  grade: number
  class_number: number
  teacher_name: string
}

const ResultsPage = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<StudentResult[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [loading, setLoading] = useState(true)
  const [webhookUrl, setWebhookUrl] = useState('https://leejs05.app.n8n.cloud/webhook-test/bc771d4c-001d-460b-a281-3685aef829a0')
  const [aiResponse, setAiResponse] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const navigate = useNavigate()

  const teacherName = localStorage.getItem("teacher_name")

  useEffect(() => {
    if (!teacherName) {
      navigate("/")
      return
    }
    loadResults()
  }, [teacherName, navigate])

  const loadResults = async () => {
    try {
      setLoading(true)

      // 선생님의 학급 찾기
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_name', teacherName)
        .single()

      if (classroomError || !classroomData) {
        console.error('Classroom not found:', classroomError)
        alert('학급 정보를 찾을 수 없습니다.')
        return
      }

      setClassroom(classroomData)

      // 학급의 학생들 가져오기
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', classroomData.id)
        .order('student_number', { ascending: true })

      if (studentsError) {
        console.error('Error loading students:', studentsError)
        return
      }

      // 질문들 가져오기
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions' as any)
        .select('*')
        .order('created_at', { ascending: true })

      if (questionsError) {
        console.error('Error loading questions:', questionsError)
        return
      }

      // 응답 결과 가져오기
      const { data: responsesData, error: responsesError } = await supabase
        .from('relationship_responses' as any)
        .select('*')

      if (responsesError) {
        console.error('Error loading responses:', responsesError)
        return
      }

      // 학생별 응답 결과 정리
      const studentResults: StudentResult[] = []
      
      for (const student of studentsData || []) {
        const studentResponses = (responsesData as any[] || [])
          .filter((response: any) => response.respondent_id === student.id)
          .map((response: any) => {
            const question = (questionsData as any[] || []).find((q: any) => q.id === response.question_id)
            const targetStudent = (studentsData || []).find(s => s.id === response.target_id)
            return {
              ...response,
              question,
              target_student: targetStudent
            }
          })

        studentResults.push({
          student,
          responses: studentResponses
        })
      }

      setStudents(studentsData || [])
      setQuestions((questionsData as unknown as Question[]) || [])
      setResults(studentResults)
      
      if (studentsData && studentsData.length > 0) {
        setSelectedStudent(studentsData[0])
      }

    } catch (error) {
      console.error('Error:', error)
      alert('결과를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedStudentResult = () => {
    if (!selectedStudent) return null
    return results.find(r => r.student.id === selectedStudent.id)
  }

  const generateAIContent = async () => {
    if (!selectedResult || !selectedStudent) {
      alert('학생을 선택해주세요.')
      return
    }

    try {
      setIsGenerating(true)
      setAiResponse('')
      
      const responseData = {
        student: {
          id: selectedStudent.id,
          name: selectedStudent.name,
          student_number: selectedStudent.student_number,
          classroom: {
            school_name: classroom?.school_name,
            grade: classroom?.grade,
            class_number: classroom?.class_number
          }
        },
        responses: selectedResult.responses.map(response => ({
          question_id: response.question_id,
          question_text: response.question?.question_text,
          polarity: response.question?.polarity,
          target_student: {
            id: response.target_student?.id,
            name: response.target_student?.name,
            student_number: response.target_student?.student_number
          }
        }))
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData)
      })

      if (response.ok) {
        const responseText = await response.text()
        setAiResponse(responseText)
        alert('AI 상담 내용이 성공적으로 생성되었습니다.')
      } else {
        throw new Error('서버 응답 오류')
      }
    } catch (error) {
      console.error('AI 생성 오류:', error)
      alert('AI 상담 내용 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const selectedResult = getSelectedStudentResult()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            대시보드로 돌아가기
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">설문 결과</h1>
        </div>

        <div className="flex gap-6">
          {/* 왼쪽: 학생 정보 (작은 너비) */}
          <div className="w-80 flex-shrink-0">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 border-l-4 border-orange-400 pl-3">
                학생정보
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedStudent?.id === student.id
                        ? 'bg-yellow-100 border-2 border-orange-400'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gray-200 rounded overflow-hidden border">
                        {student.photo_url ? (
                          <img 
                            src={student.photo_url} 
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-500">👤</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{classroom?.school_name}</p>
                        <p className="text-xs text-gray-500">{classroom?.grade}학년 {classroom?.class_number}반</p>
                        <p className="font-semibold text-sm">
                          {student.student_number || index + 1}번 {student.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 오른쪽: 결과 (큰 너비) */}
          <div className="flex-1">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">결과</h2>
              
              {selectedResult ? (
                <div className="space-y-6">
                  {questions.map((question, index) => {
                    const response = selectedResult.responses.find(r => r.question_id === question.id)
                    
                    return (
                      <div key={question.id} className="border-b border-gray-200 pb-4">
                        <h3 className="font-medium text-gray-800 mb-3">
                          {index + 1}. {question.question_text}
                        </h3>
                        
                        {response && response.target_student ? (
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <div className="w-12 h-14 bg-gray-200 rounded overflow-hidden border">
                              {response.target_student.photo_url ? (
                                <img 
                                  src={response.target_student.photo_url} 
                                  alt={response.target_student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">👤</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{classroom?.school_name}</p>
                              <p className="text-xs text-gray-500">{classroom?.grade}학년 {classroom?.class_number}반</p>
                              <p className="font-semibold">
                                {response.target_student.student_number}번 {response.target_student.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">응답 없음</p>
                        )}
                      </div>
                    )
                  })}

                  {/* Webhook URL 설정 */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <Label htmlFor="webhook-url" className="text-sm font-medium text-gray-700 mb-2 block">
                      AI 생성 요청 URL (테스트용)
                    </Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full"
                      placeholder="Webhook URL을 입력하세요"
                    />
                  </div>

                  {/* 학부모 상담 내용 AI 생성 버튼 */}
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="mb-4" 
                      onClick={generateAIContent}
                      disabled={isGenerating}
                    >
                      {isGenerating ? '생성 중...' : '학부모 상담 내용 AI 생성'}
                    </Button>
                    
                    {/* 학부모 상담용 추천 내용 */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">학부모 상담용 추천 내용</h4>
                      {aiResponse ? (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {aiResponse}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          위의 "학부모 상담 내용 AI 생성" 버튼을 눌러서 개인별 맞춤 상담 내용을 생성해보세요.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">학생을 선택해주세요.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsPage