import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"

interface Student {
  id: string
  name: string
  photo_url?: string
  student_number?: number
}

const SurveyPage = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const school = searchParams.get("school")
  const grade = searchParams.get("grade") 
  const classNumber = searchParams.get("class")
  const teacherName = searchParams.get("teacher")

  useEffect(() => {
    if (!school || !grade || !classNumber || !teacherName) {
      navigate("/")
      return
    }

    loadStudents()
  }, [school, grade, classNumber, teacherName, navigate])

  const loadStudents = async () => {
    try {
      setLoading(true)
      
      // 먼저 해당 학급을 찾기
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('school_name', school)
        .eq('grade', parseInt(grade!))
        .eq('class_number', parseInt(classNumber!))
        .eq('teacher_name', teacherName)
        .single()

      if (classroomError || !classroom) {
        console.error('Classroom not found:', classroomError)
        alert('해당 학급을 찾을 수 없습니다.')
        return
      }

      // 해당 학급의 학생들 조회
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, photo_url, student_number')
        .eq('classroom_id', classroom.id)
        .order('student_number', { ascending: true })

      if (studentsError) {
        console.error('Error loading students:', studentsError)
        alert('학생 정보를 불러오는 중 오류가 발생했습니다.')
        return
      }

      setStudents(studentsData || [])
    } catch (error) {
      console.error('Error:', error)
      alert('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (student: Student) => {
    // 로컬스토리지에 학생 ID 저장
    localStorage.setItem('selected_student_id', student.id)
    
    // 학생 확인 페이지로 이동
    const params = new URLSearchParams({
      school: school!,
      grade: grade!,
      class: classNumber!,
      teacher: teacherName!,
      studentId: student.id
    })
    navigate(`/student-confirm?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">학생 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">등록된 학생이 없습니다.</p>
          <Button onClick={() => navigate("/dashboard")}>
            대시보드로 돌아가기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-4xl">🌻</span>
            <h1 className="text-3xl font-bold text-gray-800">나를 선택해주세요</h1>
            <span className="text-4xl">🌻</span>
          </div>
          <p className="text-lg text-gray-600">
            {school} {grade}학년 {classNumber}반 ({teacherName} 선생님)
          </p>
        </div>

        {/* 학생 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {students.map((student, index) => (
            <Card 
              key={student.id}
              className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-b from-yellow-100 to-orange-100 border-2 border-orange-200 hover:border-orange-300"
              onClick={() => handleStudentSelect(student)}
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

        {/* 하단 안내 */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            자신의 사진을 클릭해주세요
          </p>
        </div>
      </div>
    </div>
  )
}

export default SurveyPage