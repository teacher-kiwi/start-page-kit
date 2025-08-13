
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { getCurrentUser } from "@/lib/auth-utils"
import { ClassroomManagement } from "@/components/ClassroomManagement"
import { SurveyManagement } from "@/components/SurveyManagement"

interface StudentInput {
  id: string
  name: string
  image: File | null
  imageUrl?: string
  student_id?: string
  student_number?: number
}

interface Classroom {
  id: string
  teacher_name: string
  school: string
  grade: string
  class_number: string
}

interface Student {
  id: string
  name: string
  classroom_id: string
  image_url?: string
  student_number?: number
}

const Dashboard = () => {
  const [teacherName, setTeacherName] = useState<string>("")
  const [school, setSchool] = useState<string>("")
  const [grade, setGrade] = useState<string>("")
  const [classNumber, setClassNumber] = useState<string>("")
  const [studentInputs, setStudentInputs] = useState<StudentInput[]>([])
  const [classroomId, setClassroomId] = useState<string>("")
  const [hasExistingClassroom, setHasExistingClassroom] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  const loadClassroomData = async (teacherName: string) => {
    try {
      // First create/update profile for current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("profiles")
          .upsert({ 
            user_id: user.id, 
            teacher_name: teacherName 
          }, { 
            onConflict: 'user_id' 
          })
      }
      
      // classrooms 테이블에서 선생님 이름으로 조회
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_name', teacherName)
        .single()

      if (classroomError || !classroom) {
        console.log('No classroom found for teacher:', teacherName)
        setHasExistingClassroom(false)
        setLoading(false)
        return
      }

      // 기존 클래스룸이 있는 경우
      setHasExistingClassroom(true)
      setClassroomId(classroom.id)
      setSchool(classroom.school_name || '')
      setGrade(classroom.grade?.toString() || '')
      setClassNumber(classroom.class_number?.toString() || '')

      // students 테이블에서 해당 클래스룸의 학생들 조회
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', classroom.id)

      if (studentsError) {
        console.error('Error loading students:', studentsError)
      } else if (students) {
        // 학생 데이터를 폼 형식으로 변환
        const studentInputsData = students.map((student, index) => ({
          id: `student-${student.id}`,
          name: student.name,
          image: null, // 이미지는 파일 객체가 아니므로 null로 설정
          imageUrl: student.photo_url || undefined, // 기존 이미지 URL
          student_id: student.id,
          student_number: student.student_number || (index + 1)
        }))
        setStudentInputs(studentInputsData)
      }
    } catch (error) {
      console.error('Error loading classroom data:', error)
      setHasExistingClassroom(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const deriveName = (userObj: any) => {
      const meta = userObj?.user_metadata || {}
      return (
        meta.name ||
        meta.full_name ||
        meta.preferred_username ||
        (userObj?.email ? userObj.email.split("@")[0] : "")
      )
    }

    const checkAuth = async () => {
      if (!mounted) return
      
      const { user } = await getCurrentUser()
      
      if (user) {
        const name = deriveName(user)
        setTeacherName(name)
        loadClassroomData(name)
      } else {
        navigate("/")
      }
    }

    // Supabase 세션 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) {
        const name = deriveName(session.user)
        setTeacherName(name)
        loadClassroomData(name)
      } else {
        navigate("/")
      }
    })

    // 초기 인증 확인
    checkAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (!teacherName || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
            <p className="text-muted-foreground mt-1">{teacherName} 선생님</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            로그아웃
          </Button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 학급 관리 섹션 */}
          <ClassroomManagement
            teacherName={teacherName}
            school={school}
            setSchool={setSchool}
            grade={grade}
            setGrade={setGrade}
            classNumber={classNumber}
            setClassNumber={setClassNumber}
            studentInputs={studentInputs}
            setStudentInputs={setStudentInputs}
            classroomId={classroomId}
            hasExistingClassroom={hasExistingClassroom}
            loadClassroomData={loadClassroomData}
          />

          {/* 설문 관리 섹션 */}
          <SurveyManagement
            school={school}
            grade={grade}
            classNumber={classNumber}
            teacherName={teacherName}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
