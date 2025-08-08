import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const selectedResult = getSelectedStudentResult()

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 학생 정보 */}
          <div className="lg:col-span-1">
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

          {/* 오른쪽: 결과 */}
          <div className="lg:col-span-2">
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

                  {/* 학부모 상담 내용 AI 생성 버튼 */}
                  <div className="pt-4">
                    <Button variant="outline" className="mb-4">
                      학부모 상담 내용 AI 생성
                    </Button>
                    
                    {/* 학부모 상담용 추천 내용 */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">학부모 상담용 추천 내용</h4>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {selectedStudent?.name}은 친구들과의 관계에서 긍정적인 모습을 보이고 있습니다. 
                        친구들로부터 많은 지지를 받고 있으며, 의사소통 능력이 뛰어납니다.
                      </p>
                      
                      <p className="text-sm text-gray-700 leading-relaxed">
                        앞으로도 지속적인 사회성 발달을 위해 다양한 활동에 참여하고, 
                        친구들과의 협력을 통해 더욱 성장할 수 있도록 격려해 주시기 바랍니다.
                      </p>
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