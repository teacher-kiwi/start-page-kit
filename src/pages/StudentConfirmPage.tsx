import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
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

const StudentConfirmPage = () => {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const school = searchParams.get("school")
  const grade = searchParams.get("grade") 
  const classNumber = searchParams.get("class")
  const teacherName = searchParams.get("teacher")
  const studentId = searchParams.get("studentId")
  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      // 토큰 기반 로딩
      if (!studentId) {
        navigate("/")
        return
      }
      loadStudentWithToken()
    } else if (!school || !grade || !classNumber || !teacherName || !studentId) {
      navigate("/")
      return
    } else {
      loadStudent()
    }
  }, [school, grade, classNumber, teacherName, studentId, token, navigate])

  const loadStudentWithToken = async () => {
    try {
      setLoading(true)
      
      // 토큰 검증
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('verify-token', {
        body: { token }
      });

      if (tokenError || !tokenData?.valid) {
        console.error('Token verification failed:', tokenError);
        alert('유효하지 않은 접근입니다. QR코드를 다시 스캔해주세요.');
        navigate("/");
        return;
      }

      // Edge function으로 학생 정보 가져오기
      const { data: studentListData, error: studentError } = await supabase.functions.invoke('get-student-list', {
        body: { token }
      });

      if (studentError || !studentListData?.students) {
        console.error('Error loading students:', studentError);
        alert('학생 정보를 불러오는 중 오류가 발생했습니다.');
        return;
      }

      // 해당 학생 찾기
      const studentData = studentListData.students.find((s: any) => s.id === studentId);
      if (!studentData) {
        alert('학생 정보를 찾을 수 없습니다.');
        navigate(-1);
        return;
      }

      setStudent(studentData);
    } catch (error) {
      console.error('Error:', error)
      alert('학생 정보를 불러오는 중 오류가 발생했습니다.')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const loadStudent = async () => {
    try {
      setLoading(true)
      
      const { data: studentData, error } = await supabase
        .from('students')
        .select('id, name, photo_url, student_number')
        .eq('id', studentId!)
        .single()

      if (error || !studentData) {
        console.error('Student not found:', error)
        alert('학생 정보를 찾을 수 없습니다.')
        navigate(-1)
        return
      }

      setStudent(studentData)
    } catch (error) {
      console.error('Error:', error)
      alert('학생 정보를 불러오는 중 오류가 발생했습니다.')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    // 로컬스토리지에서 학생 ID 제거
    localStorage.removeItem('selected_student_id')
    
    // 학생 선택 페이지로 돌아가기
    if (token) {
      navigate(`/survey?token=${token}`)
    } else {
      const params = new URLSearchParams({
        school: school!,
        grade: grade!,
        class: classNumber!,
        teacher: teacherName!
      })
      navigate(`/survey?${params.toString()}`)
    }
  }

  const handleStart = () => {
    // 토큰 저장
    if (token) {
      localStorage.setItem('survey_token', token)
    }
    // 설문 페이지로 이동
    navigate('/survey-questions')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">학생 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">학생 정보를 찾을 수 없습니다.</p>
          <Button onClick={handleGoBack}>
            돌아가기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 돌아가기 버튼 */}
      <div className="absolute top-6 left-6">
        <Button 
          onClick={handleGoBack}
          variant="ghost"
          className="bg-white/80 hover:bg-white shadow-sm rounded-full px-4 py-2 text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          다시 선택하기
        </Button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8 max-w-md mx-auto">
          {/* 해바라기 아이콘 */}
          <div className="text-6xl">
            🌻
          </div>

          {/* 학교 정보 */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {school}
            </h1>
            <h2 className="text-3xl font-bold text-gray-800">
              {grade}학년 {classNumber}반 {student.name}
            </h2>
          </div>

          {/* 학생 사진 */}
          <div className="flex justify-center">
            <div className="w-48 h-56 bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white">
              {student.photo_url ? (
                <img 
                  src={student.photo_url} 
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-6xl text-gray-500">👤</span>
                </div>
              )}
            </div>
          </div>

          {/* 시작하기 버튼 */}
          <div className="w-full">
            <Button 
              onClick={handleStart}
              className="w-full h-14 text-xl font-bold bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-xl shadow-lg"
            >
              시작하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentConfirmPage