
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { KoreanInput } from "@/components/ui/korean-input"
import { Trash2, Plus, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface StudentInput {
  id: string
  name: string
  image: File | null
  student_id?: string
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

  const addStudentInput = () => {
    const newStudentInput: StudentInput = {
      id: Date.now().toString(),
      name: "",
      image: null
    }
    setStudentInputs([...studentInputs, newStudentInput])
  }

  const loadClassroomData = async (teacherName: string) => {
    try {
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
          student_id: student.id
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
    const storedTeacherName = localStorage.getItem("teacher_name")
    if (!storedTeacherName) {
      navigate("/")
      return
    }
    setTeacherName(storedTeacherName)
    loadClassroomData(storedTeacherName)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("teacher_name")
    navigate("/")
  }

  const removeStudentInput = (id: string) => {
    setStudentInputs(studentInputs.filter(input => input.id !== id))
  }

  const updateStudentName = (id: string, name: string) => {
    setStudentInputs(studentInputs.map(input => 
      input.id === id ? { ...input, name } : input
    ))
  }

  const updateStudentImage = (id: string, file: File | null) => {
    setStudentInputs(studentInputs.map(input => 
      input.id === id ? { ...input, image: file } : input
    ))
  }

  const handleSaveClassroom = () => {
    if (school && grade && classNumber) {
      alert("학급 정보가 저장되었습니다.")
      // 여기에 실제 저장 로직 추가 예정
    } else {
      alert("모든 정보를 입력해주세요.")
    }
  }

  const handleUpdateClassroom = () => {
    if (school && grade && classNumber) {
      alert("학급 정보가 수정되었습니다.")
      // 여기에 실제 수정 로직 추가 예정
    } else {
      alert("모든 정보를 입력해주세요.")
    }
  }

  const handleCreateSurvey = () => {
    if (school && grade && classNumber) {
      alert("설문지와 함께 QR코드가 생성됩니다.")
      // 여기에 실제 설문지 생성 로직 추가
    } else {
      alert("모든 정보를 입력해주세요.")
    }
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">학급 관리</h1>
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

        <Card className="p-8 space-y-8">
          {/* 학교 입력 */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">학교</h2>
            <KoreanInput
              type="text"
              placeholder="학교를 입력해주세요."
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </div>

          {/* 학급 선택 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">학급</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">학년</label>
                <KoreanInput
                  type="text"
                  placeholder="1"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">반</label>
                <KoreanInput
                  type="text"
                  placeholder="1"
                  value={classNumber}
                  onChange={(e) => setClassNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 학생 정보 입력 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">학생 정보</h2>
              <Button 
                onClick={addStudentInput}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                학생 추가
              </Button>
            </div>
            
            {/* 학생 입력 목록 */}
            <div className="space-y-3">
              {studentInputs.map((studentInput, index) => (
                <div key={studentInput.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <span className="text-sm font-medium text-foreground min-w-[60px]">
                    {index + 1}
                  </span>
                  
                  <div className="flex-1">
                    <KoreanInput
                      type="text"
                      placeholder="학생 이름을 입력하세요"
                      value={studentInput.name}
                      onChange={(e) => updateStudentName(studentInput.id, e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateStudentImage(studentInput.id, e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id={`image-${studentInput.id}`}
                      />
                      {studentInput.image ? (
                        <div className="flex items-center gap-2 p-3 border border-border rounded-xl bg-input">
                          <img 
                            src={URL.createObjectURL(studentInput.image)} 
                            alt="Student preview"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-foreground truncate">
                            {studentInput.image.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 border border-border rounded-xl bg-input hover:bg-accent transition-colors">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            사진을 선택하세요
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeStudentInput(studentInput.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {studentInputs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">학생 추가 버튼을 눌러 학생을 등록하세요</p>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 섹션 */}
          <div className="space-y-4 pt-4">
            {/* 학급 정보 저장/수정 버튼 */}
            {hasExistingClassroom ? (
              <Button 
                onClick={handleUpdateClassroom}
                variant="outline" 
                className="w-full h-12"
              >
                학급 정보 수정하기
              </Button>
            ) : (
              <Button 
                onClick={handleSaveClassroom}
                variant="outline" 
                className="w-full h-12"
              >
                학급 정보 저장하기
              </Button>
            )}
            
            {/* 설문지 생성 버튼 */}
            <Button 
              onClick={handleCreateSurvey}
              variant="korean" 
              className="w-full h-12"
            >
              설문지 생성하기
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              설문지와 함께 QR코드가 생성됩니다.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
